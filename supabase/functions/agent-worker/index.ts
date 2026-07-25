// agent-worker — the specialist. One function, six behaviours.
//
// The supervisor writes an agent_tasks row and calls this with its id. The
// worker claims the task, builds its context (the project state the supervisor
// assembled, plus the project's own documents where its question needs them),
// asks Claude its one question, and writes findings back.
//
// Findings are upserted by fingerprint: the same issue found on Monday and
// again on Friday updates one row and moves last_seen_at, rather than filling
// the list with duplicates. That is what makes the fleet safe to run daily.
//
// Deploy: supabase functions deploy agent-worker
// Secrets: ANTHROPIC_API_KEY (required), ANTHROPIC_MODEL (optional)
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { encodeBase64 } from "jsr:@std/encoding/base64";
import {
  FINDINGS_SCHEMA,
  promptFor,
  WORKER_SYSTEM_PROMPT,
} from "./prompts.ts";

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

// Which specialists need to read the actual filed documents rather than just
// the project's structured state. Reading PDFs is the expensive part, so only
// the questions that genuinely require the source text pay for it.
const NEEDS_DOCUMENTS = new Set([
  "doc-completeness",
  "comments-responses",
  "obligation-register",
]);
const MAX_DOCS = 6;
const MAX_DOC_BYTES = 25 * 1024 * 1024;
// The private bucket project files are uploaded to (see 20260610000002_storage.sql).
const DOCUMENTS_BUCKET = "project-documents";

interface Finding {
  title: string;
  detail: string;
  proposed_action: string;
  severity: string;
  subject: string;
  evidence: { source: string; locator: string; quote: string }[];
}

/**
 * Stable across runs: same project, same agent, same underlying issue → same
 * fingerprint → one row that ages, instead of a new row every cycle.
 */
async function fingerprint(
  projectId: string,
  agentKey: string,
  subject: string,
): Promise<string> {
  const normalised = `${projectId}:${agentKey}:${
    subject.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
  }`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalised),
  );
  return Array.from(new Uint8Array(digest)).slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Recently-updated project documents, as native PDF blocks for the model. */
async function documentBlocks(db: SupabaseClient, projectId: string) {
  // `documents` stores no MIME type — only doc_type, which is a category
  // (application form, scoping report, …) rather than a format. PDF-ness comes
  // off the stored filename, the same thing the upload path writes.
  const { data: docs, error: queryError } = await db
    .from("documents")
    .select("id, name, storage_path")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(MAX_DOCS);

  // A failed lookup must not read as "this project has no documents" — that
  // silently tells the specialist everything is unverifiable and the task still
  // completes green.
  if (queryError) {
    throw new Error(`Could not list project documents: ${queryError.message}`);
  }

  const blocks: unknown[] = [];
  const names: string[] = [];

  for (const doc of docs ?? []) {
    const path = doc.storage_path as string | null;
    if (!path || !path.toLowerCase().endsWith(".pdf")) continue;
    const { data: blob, error } = await db.storage
      .from(DOCUMENTS_BUCKET)
      .download(path);
    if (error || !blob) continue;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (bytes.byteLength > MAX_DOC_BYTES) continue;
    blocks.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: encodeBase64(bytes),
      },
      title: doc.name,
      cache_control: { type: "ephemeral" },
    });
    names.push(doc.name as string);
  }

  return { blocks, names };
}

async function runTask(db: SupabaseClient, taskId: string) {
  const patch = (fields: Record<string, unknown>) =>
    db.from("agent_tasks").update(fields).eq("id", taskId);

  const { data: task } = await db
    .from("agent_tasks")
    .select("id, run_id, project_id, agent_key, input, status")
    .eq("id", taskId)
    .maybeSingle();
  if (!task) return;

  try {
    await patch({
      status: "running",
      started_at: new Date().toISOString(),
      error_message: null,
    });

    const agentKey = task.agent_key as string;
    const projectId = task.project_id as string;
    const input = (task.input ?? {}) as {
      focus?: string;
      situation?: string;
      state?: string;
      dismissed?: { title: string; resolution_note: string }[];
    };

    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
    });

    // --- Context ------------------------------------------------------------
    const content: unknown[] = [];
    let docNote = "No project documents were attached for this check.";

    if (NEEDS_DOCUMENTS.has(agentKey)) {
      await patch({ status_note: "Reading the filed documents…" });
      const { blocks, names } = await documentBlocks(db, projectId);
      content.push(...blocks);
      docNote = names.length
        ? `The following project documents are attached, most recent first: ${
          names.join("; ")
        }. Anything not attached is not available to you — treat it as unread, not as absent.`
        : "No PDF documents are filed against this project yet, so anything you would verify from a document is unverifiable this cycle. Say so rather than assuming.";
    }

    const dismissed = (input.dismissed ?? []).map((d) =>
      `- ${d.title}${d.resolution_note ? ` — ${d.resolution_note}` : ""}`
    ).join("\n") || "- none";

    content.push({
      type: "text",
      text: `${promptFor(agentKey)}

---

PROJECT STATE

${input.state ?? "No state was supplied."}

---

THE SUPERVISOR'S READ OF THE SITUATION

${input.situation ?? "—"}

FOCUS FOR THIS CYCLE

${
        input.focus ??
          "No narrower focus was set — apply your full question."
      }

---

DOCUMENTS

${docNote}

---

PREVIOUSLY DISMISSED BY A HUMAN — do not raise again unless the facts have changed:

${dismissed}`,
    });

    // --- Ask ----------------------------------------------------------------
    await patch({ status_note: "Working…" });
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: WORKER_SYSTEM_PROMPT,
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: FINDINGS_SCHEMA },
      },
      messages: [{ role: "user", content: content as never }],
    });

    if (response.stop_reason === "refusal") {
      throw new Error("The model declined this check.");
    }
    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") {
      throw new Error("The specialist returned no result.");
    }
    const result = JSON.parse(text.text) as {
      assessment: string;
      findings: Finding[];
    };

    // --- Write findings -----------------------------------------------------
    const now = new Date().toISOString();
    for (const f of result.findings) {
      const fp = await fingerprint(projectId, agentKey, f.subject);

      // Upsert on (project_id, fingerprint). An existing row keeps its
      // first_seen_at and — importantly — its state: if a human already
      // acknowledged or dismissed it, re-finding it must not silently reopen it.
      const { data: existing } = await db
        .from("agent_findings")
        .select("id, state")
        .eq("project_id", projectId)
        .eq("fingerprint", fp)
        .maybeSingle();

      if (existing) {
        if (existing.state === "dismissed") continue;
        await db.from("agent_findings").update({
          run_id: task.run_id,
          task_id: taskId,
          severity: f.severity,
          title: f.title,
          detail: f.detail,
          proposed_action: f.proposed_action,
          evidence: f.evidence,
          last_seen_at: now,
        }).eq("id", existing.id as string);
      } else {
        await db.from("agent_findings").insert({
          project_id: projectId,
          run_id: task.run_id,
          task_id: taskId,
          agent_key: agentKey,
          severity: f.severity,
          state: "open",
          title: f.title,
          detail: f.detail,
          proposed_action: f.proposed_action,
          evidence: f.evidence,
          fingerprint: fp,
          first_seen_at: now,
          last_seen_at: now,
        });
      }
    }

    await patch({
      status: "complete",
      status_note: result.findings.length
        ? `${result.findings.length} finding${
          result.findings.length === 1 ? "" : "s"
        }.`
        : "Nothing to raise.",
      output: result,
      model: MODEL,
      input_tokens: response.usage?.input_tokens ?? null,
      output_tokens: response.usage?.output_tokens ?? null,
      finished_at: now,
    });
  } catch (err) {
    console.error(`agent-worker failed for task ${taskId}:`, err);
    await patch({
      status: "error",
      status_note: null,
      error_message: err instanceof Error ? err.message : String(err),
      finished_at: new Date().toISOString(),
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  // Workers are dispatched by the supervisor only — never called from a browser.
  if (req.headers.get("Authorization") !== `Bearer ${serviceKey}`) {
    return json({ error: "Workers are dispatched by the supervisor." }, 403);
  }
  if (!Deno.env.get("ANTHROPIC_API_KEY")) {
    return json({ error: "ANTHROPIC_API_KEY is not configured." }, 500);
  }

  let body: { task_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!body.task_id) return json({ error: "task_id is required" }, 400);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

  // @ts-ignore EdgeRuntime is provided by the Supabase edge runtime
  EdgeRuntime.waitUntil(runTask(db, body.task_id));

  return json({ started: true, task_id: body.task_id }, 202);
});
