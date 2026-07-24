// licence-review — reads an uploaded licence PDF with Claude and builds the
// audit checklist. Replaces the whole Make.com + CloudConvert + OCR + Google
// Sheets pipeline with two model calls:
//
//   Pass 1 (fast): classify the document (WML / N&S registration / WUL / EA /
//           AEL / …), pull licence metadata, count pages.
//   Pass 2: extract every numbered condition VERBATIM with its ref + page
//           number, flagged heading vs auditable.
//
// The PDF goes to Claude natively (base64 document block — scanned or digital,
// no OCR step). Both passes share the same system prompt + document block with
// a cache breakpoint, so pass 2 reads the document from the prompt cache.
//
// The caller gets a 202 immediately; work continues via EdgeRuntime.waitUntil
// and progress is written to licence_audits.processing_status, which the UI
// polls. Secrets: ANTHROPIC_API_KEY (required), ANTHROPIC_MODEL (optional,
// defaults to claude-opus-5).
//
// Deploy: supabase functions deploy licence-review
//         supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { encodeBase64 } from "jsr:@std/encoding/base64";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

const MODEL = Deno.env.get("ANTHROPIC_MODEL") || "claude-opus-5";

// ---------------------------------------------------------------------------
// Structured-output schemas (strict JSON schema: additionalProperties false,
// everything required; absent values are empty strings / empty arrays)
// ---------------------------------------------------------------------------

const CLASSIFY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["doc_type", "doc_type_label", "summary", "page_count", "metadata"],
  properties: {
    doc_type: {
      type: "string",
      enum: [
        "waste_management_licence",
        "norms_and_standards_registration",
        "water_use_licence",
        "environmental_authorisation",
        "general_authorisation",
        "atmospheric_emission_licence",
        "other",
      ],
    },
    doc_type_label: {
      type: "string",
      description:
        "Short human-readable label for this exact document, e.g. 'Waste Management Licence (s49(1)(a) NEM:WA)'",
    },
    summary: {
      type: "string",
      description:
        "2-3 sentence plain-language summary: what this document authorises, for whom, at which facility",
    },
    page_count: { type: "integer" },
    metadata: {
      type: "object",
      additionalProperties: false,
      required: [
        "licence_number",
        "licence_holder",
        "facility_name",
        "sector",
        "location",
        "issuing_authority",
        "issue_date",
        "review_or_expiry_date",
        "listed_activities",
      ],
      properties: {
        licence_number: { type: "string" },
        licence_holder: { type: "string" },
        facility_name: { type: "string" },
        sector: { type: "string" },
        location: { type: "string" },
        issuing_authority: { type: "string" },
        issue_date: { type: "string" },
        review_or_expiry_date: { type: "string" },
        listed_activities: {
          type: "array",
          items: { type: "string" },
          description:
            "Listed activities authorised, verbatim where practical, e.g. 'Category B(4): The treatment of hazardous waste in excess of 1 ton per day…'",
        },
      },
    },
  },
} as const;

const EXTRACT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["sections"],
  properties: {
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "items"],
        properties: {
          title: {
            type: "string",
            description:
              "Section heading with its number, e.g. '2.2 Site Security and Access Control'",
          },
          items: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "requirement", "ref", "page", "auditable"],
              properties: {
                id: {
                  type: "string",
                  description: "Condition number exactly as printed, e.g. '2.3.1'",
                },
                requirement: {
                  type: "string",
                  description:
                    "The condition text VERBATIM, including its (a)/(b)/(i)/(ii) sub-points on new lines",
                },
                ref: {
                  type: "string",
                  description: "Citation for the report, e.g. 'Condition 2.3.1'",
                },
                page: {
                  type: "integer",
                  description: "1-indexed PDF page where this condition starts",
                },
                auditable: {
                  type: "boolean",
                  description:
                    "true if an auditor can check compliance against it on site or in records",
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Prompts — shared system prompt keeps the cache prefix identical across both
// passes; the per-pass instruction goes after the cached document block.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert environmental compliance auditor in South Africa working for Silverline, an environmental compliance consultancy. You review licences, permits, registrations and authorisations issued under South African environmental law (NEM:WA, NEMA, NWA, NEM:AQA and related regulations) by authorities such as the DFFE, DWS and provincial departments.

You read the supplied document exactly as issued. Accuracy is paramount: when asked for condition text you reproduce it verbatim — never paraphrase, never renumber, never merge or invent conditions. If a scanned word is genuinely illegible, transcribe your best reading followed by "[?]".`;

const CLASSIFY_PROMPT = `Read the attached document and identify what it is.

Classify it into one of the doc_type categories, write a short label naming the exact instrument and its legal basis, summarise what it authorises, count its pages, and extract the metadata fields from the cover pages. Use an empty string for anything the document does not state.`;

const EXTRACT_PROMPT = `Go through the attached document page by page and extract EVERY numbered condition, verbatim.

Rules:
- Cover the entire document from the first condition to the last, including conditions inside annexures. Do not stop early; do not skip pages.
- One item per numbered condition (e.g. 2.3.1). Keep its lettered/roman sub-points (a), (b), (i) inside that item's requirement text, each on its own line.
- requirement is the exact printed text. No paraphrasing, no summaries, no corrections to grammar.
- Group items under the document's own section headings, in document order.
- page is the PDF page number (1-indexed, as a PDF viewer shows it) where the condition starts.
- auditable = false only for items that carry no obligation an auditor could check: pure definitions, interpretation clauses, appeal-process instructions, addresses, tables of contents. When in doubt, auditable = true — never lose a real condition.
- Where a condition consists of a table (e.g. operating parameters, waste acceptance limits), reproduce the table content as "Label: value" lines in the requirement text.`;

// ---------------------------------------------------------------------------
// Checklist shape stored on the row (superset of what the model returns:
// audit fields initialised empty)
// ---------------------------------------------------------------------------

interface ExtractedItem {
  id: string;
  requirement: string;
  ref: string;
  page: number;
  auditable: boolean;
}
interface ExtractedSection {
  title: string;
  items: ExtractedItem[];
}

function toChecklist(sections: ExtractedSection[]) {
  return sections
    .filter((s) => s.items.length > 0)
    .map((s) => ({
      title: s.title,
      items: s.items.map((i) => ({
        id: i.id,
        requirement: i.requirement,
        ref: i.ref,
        page: i.page,
        auditable: i.auditable,
        status: null as string | null,
        observation: "",
        correctiveAction: "",
        priority: null as string | null,
        targetDate: "",
      })),
    }));
}

// ---------------------------------------------------------------------------
// The pipeline (runs in the background after the 202)
// ---------------------------------------------------------------------------

async function processAudit(
  db: ReturnType<typeof createClient>,
  auditId: string,
  storagePath: string,
) {
  const patch = (fields: Record<string, unknown>) =>
    db.from("licence_audits").update(fields).eq("id", auditId);

  try {
    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
    });

    // 1. Download the PDF from storage
    await patch({
      processing_status: "reading",
      processing_note: "Reading the document…",
      error_message: null,
    });

    const { data: blob, error: dlError } = await db.storage
      .from("licence-pdfs")
      .download(storagePath);
    if (dlError || !blob) {
      throw new Error(`Could not download PDF: ${dlError?.message ?? "not found"}`);
    }
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (bytes.byteLength > 30 * 1024 * 1024) {
      throw new Error(
        "PDF is larger than 30 MB. Please compress it and upload again.",
      );
    }
    const pdfBase64 = encodeBase64(bytes);

    // Shared document block. cache_control here means pass 2 reads the whole
    // system+document prefix from cache instead of re-processing the PDF.
    const documentBlock = {
      type: "document" as const,
      source: {
        type: "base64" as const,
        media_type: "application/pdf" as const,
        data: pdfBase64,
      },
      cache_control: { type: "ephemeral" as const },
    };

    // 2. Pass 1 — classify + metadata (fast, low effort)
    const classifyResponse = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: CLASSIFY_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: [documentBlock, { type: "text", text: CLASSIFY_PROMPT }],
        },
      ],
    });
    if (classifyResponse.stop_reason === "refusal") {
      throw new Error(
        "The AI declined to process this document. Please verify it is a licence/permit PDF.",
      );
    }
    const classifyText = classifyResponse.content.find((b) => b.type === "text");
    if (!classifyText || classifyText.type !== "text") {
      throw new Error("Classification returned no result.");
    }
    const classified = JSON.parse(classifyText.text);

    await patch({
      processing_status: "extracting",
      processing_note: `Identified: ${classified.doc_type_label}. Extracting conditions…`,
      doc_type: classified.doc_type,
      doc_type_label: classified.doc_type_label,
      doc_summary: classified.summary,
      page_count: classified.page_count,
      metadata: classified.metadata,
    });

    // 3. Pass 2 — verbatim condition extraction (long output → stream)
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      system: SYSTEM_PROMPT,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: EXTRACT_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: [documentBlock, { type: "text", text: EXTRACT_PROMPT }],
        },
      ],
    });
    const extractResponse = await stream.finalMessage();
    if (extractResponse.stop_reason === "refusal") {
      throw new Error("The AI declined to extract this document's conditions.");
    }
    if (extractResponse.stop_reason === "max_tokens") {
      throw new Error(
        "The document has more conditions than a single pass can hold. Please split the PDF and import it in parts.",
      );
    }
    const extractText = extractResponse.content.find((b) => b.type === "text");
    if (!extractText || extractText.type !== "text") {
      throw new Error("Extraction returned no result.");
    }
    const extracted = JSON.parse(extractText.text) as {
      sections: ExtractedSection[];
    };

    const sections = toChecklist(extracted.sections);
    const totalItems = sections.reduce((n, s) => n + s.items.length, 0);
    if (totalItems === 0) {
      throw new Error("No conditions were found in this document.");
    }

    // 4. Done
    await patch({
      processing_status: "ready",
      processing_note: `Checklist ready — ${totalItems} conditions across ${sections.length} sections.`,
      sections,
    });
  } catch (err) {
    console.error(`licence-review failed for audit ${auditId}:`, err);
    const message = err instanceof Error ? err.message : String(err);
    await patch({
      processing_status: "error",
      processing_note: null,
      error_message: message,
    });
  }
}

// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;

  // 1. Identify the caller from their JWT — internal staff only.
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: {
      headers: { Authorization: req.headers.get("Authorization") ?? "" },
    },
    auth: { persistSession: false },
  });
  const {
    data: { user },
  } = await caller.auth.getUser();
  if (!user) return json({ error: "Not authenticated" }, 401);

  const { data: profile } = await caller
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !profile.active || !["admin", "staff"].includes(profile.role)) {
    return json({ error: "Internal users only." }, 403);
  }

  if (!Deno.env.get("ANTHROPIC_API_KEY")) {
    return json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      500,
    );
  }

  // 2. Validate the audit row
  let body: { audit_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!body.audit_id) return json({ error: "audit_id is required" }, 400);

  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: audit } = await db
    .from("licence_audits")
    .select("id, storage_path, processing_status")
    .eq("id", body.audit_id)
    .maybeSingle();
  if (!audit) return json({ error: "Audit not found" }, 404);
  if (!audit.storage_path) return json({ error: "Audit has no uploaded PDF" }, 400);
  if (["reading", "extracting"].includes(audit.processing_status as string)) {
    return json({ error: "This audit is already being processed." }, 409);
  }

  // 3. Kick off the pipeline in the background; the UI polls the row.
  // @ts-ignore EdgeRuntime is provided by the Supabase edge runtime
  EdgeRuntime.waitUntil(
    processAudit(db, audit.id as string, audit.storage_path as string),
  );

  return json({ started: true, audit_id: audit.id }, 202);
});
