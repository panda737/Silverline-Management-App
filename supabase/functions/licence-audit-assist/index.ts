// licence-audit-assist — small Claude helpers for conducting a licence audit:
//
//   action: "corrective_action" → practical corrective action + priority for
//           one non-conformant checklist item (prompt evolved from the
//           silverlinetools.co.za version, which banned consultant boilerplate)
//   action: "exec_summary"      → executive summary paragraphs for the
//           external (DFFE-ready) audit report, from the full findings
//
// Secrets: ANTHROPIC_API_KEY (required), ANTHROPIC_MODEL (optional).
// Deploy: supabase functions deploy licence-audit-assist
import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

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
// Corrective action
// ---------------------------------------------------------------------------

const CORRECTIVE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["corrective_action", "priority", "timeframe"],
  properties: {
    corrective_action: { type: "string" },
    priority: { type: "string", enum: ["high", "medium", "low"] },
    timeframe: {
      type: "string",
      description: "Realistic completion window, e.g. 'Immediately', '30 days', '3 months'",
    },
  },
} as const;

const CORRECTIVE_SYSTEM = `You are a practical South African environmental compliance consultant helping site managers fix real non-conformances found during audits of licensed facilities.

Write a short, specific corrective action — what the site operator must physically DO to resolve the finding.

Rules:
- Start with an imperative verb (Ensure, Place, Install, Train, Appoint, Submit, Post, Repair, Compile, Implement, Conduct, Restock, etc.)
- Be specific about WHAT to do and WHERE or HOW, grounded in the exact requirement given
- Do NOT use generic phrases like: "bring the site into compliance", "assign a responsible person", "document evidence in the site compliance register", "set a target completion date", "implement immediate corrective measures", "strengthen existing controls"
- Do NOT restate the requirement or reference the licence condition by number
- Plain sentences only — no bullet points, markdown, or headings
- 2–3 sentences maximum, written as clear practical guidance for a site manager

Example, for a requirement that staff must have access to a copy of the licence:
"Ensure multiple printed copies of the Waste Management Licence are available across the site, including at the site office, entrance gatehouse, and any active work areas. Place each copy in a protective sleeve and mount it where it is visible and accessible to anyone performing duties in that area."

Priority: high = risk of environmental harm, legal exposure, or authority action; medium = compliance gap without immediate risk; low = administrative or housekeeping.`;

// ---------------------------------------------------------------------------
// Executive summary
// ---------------------------------------------------------------------------

const SUMMARY_SYSTEM = `You are a senior South African environmental compliance auditor writing the executive summary of an external compliance audit report that will be submitted to the licence holder and to the competent authority (e.g. the DFFE).

Write 2–4 short paragraphs of plain professional prose (no headings, no bullet points, no markdown):
1. What was audited: the facility, the instrument audited against, and when.
2. The overall compliance picture, with the key numbers (conditions assessed, compliant, partially compliant, non-compliant, not applicable) woven into sentences.
3. The most significant non-conformances and their risk, briefly.
4. A closing sentence on the corrective action plan and any recommended follow-up.

Be factual and measured — this is a formal regulatory document. Do not exaggerate, do not soften genuine non-compliance, and do not invent findings that are not in the data provided.`;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
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

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return json({ error: "ANTHROPIC_API_KEY is not configured on the server." }, 500);
  }
  const anthropic = new Anthropic({ apiKey });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  try {
    if (body.action === "corrective_action") {
      const { requirement, ref, observation, status } = body as {
        requirement?: string;
        ref?: string;
        observation?: string;
        status?: string;
      };
      if (!requirement) return json({ error: "requirement is required" }, 400);

      const userPrompt = [
        `Requirement: ${requirement}`,
        ref ? `Licence reference: ${ref}` : "",
        `Compliance status: ${status === "non_compliant" ? "Non-compliant" : "Partially compliant"}`,
        observation ? `Auditor observation: ${observation}` : "",
        "Write the corrective action.",
      ]
        .filter(Boolean)
        .join("\n");

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4000,
        system: CORRECTIVE_SYSTEM,
        output_config: {
          effort: "low",
          format: { type: "json_schema", schema: CORRECTIVE_SCHEMA },
        },
        messages: [{ role: "user", content: userPrompt }],
      });
      if (response.stop_reason === "refusal") {
        return json({ error: "The AI declined this request." }, 502);
      }
      const text = response.content.find((b) => b.type === "text");
      if (!text || text.type !== "text") {
        return json({ error: "No result returned." }, 502);
      }
      return json(JSON.parse(text.text));
    }

    if (body.action === "exec_summary") {
      const { findings } = body as { findings?: unknown };
      if (!findings) return json({ error: "findings is required" }, 400);

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 8000,
        system: SUMMARY_SYSTEM,
        output_config: { effort: "medium" },
        messages: [
          {
            role: "user",
            content: `Audit data (JSON):\n${JSON.stringify(findings, null, 2)}\n\nWrite the executive summary.`,
          },
        ],
      });
      if (response.stop_reason === "refusal") {
        return json({ error: "The AI declined this request." }, 502);
      }
      const text = response.content.find((b) => b.type === "text");
      if (!text || text.type !== "text") {
        return json({ error: "No result returned." }, 502);
      }
      return json({ summary: text.text.trim() });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("licence-audit-assist error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
