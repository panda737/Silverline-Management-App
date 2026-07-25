// agent-supervisor — the orchestrator.
//
// One supervisor cycle:
//   1. Load the project's live state (stage, deadlines, document checklist,
//      listed activities, and the findings still open from previous runs).
//   2. Ask Claude to PLAN: which specialists are worth dispatching right now,
//      in what order, and — just as important — which to skip and why. A run
//      that dispatches everything every time is noise; the plan is the value.
//   3. Dispatch the chosen workers by inserting agent_tasks rows and invoking
//      each worker function. Workers run independently and write their own
//      findings.
//   4. Wait for them, then COLLATE: dedupe against open findings by
//      fingerprint, drop anything a human previously dismissed, rank what's
//      left, and write a short brief.
//
// The supervisor never edits project data and never contacts anyone. It
// produces a ranked list of proposals and a paragraph of context. Everything
// outward-facing stays a human decision — on a regulatory file a wrong
// automated action is not recoverable.
//
// Deploy: supabase functions deploy agent-supervisor
// Secrets: ANTHROPIC_API_KEY (required), ANTHROPIC_MODEL (optional)
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
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

// How long the supervisor waits for its workers before collating what it has.
const WORKER_TIMEOUT_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 4000;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["situation", "dispatch", "skip"],
  properties: {
    situation: {
      type: "string",
      description:
        "2-3 sentences: where this project actually stands right now and what the binding constraint is.",
    },
    dispatch: {
      type: "array",
      description: "Specialists worth running this cycle, in the order to run them.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["agent_key", "reason", "focus"],
        properties: {
          agent_key: { type: "string" },
          reason: {
            type: "string",
            description: "Why this specialist's question is live right now.",
          },
          focus: {
            type: "string",
            description:
              "The specific thing to look at this cycle, so the worker does not re-check settled ground.",
          },
        },
      },
    },
    skip: {
      type: "array",
      description:
        "Specialists deliberately not run, with the reason. Recorded so a human can disagree.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["agent_key", "reason"],
        properties: {
          agent_key: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
  },
} as const;

const BRIEF_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["brief", "ranked"],
  properties: {
    brief: {
      type: "string",
      description:
        "A short brief for the project lead: what changed, what is now the most urgent thing, what needs a decision. Plain sentences, no headings, under 200 words.",
    },
    ranked: {
      type: "array",
      description:
        "Finding ids from most to least urgent, and the severity the supervisor settles on after seeing them together.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["finding_id", "severity", "note"],
        properties: {
          finding_id: { type: "string" },
          severity: {
            type: "string",
            enum: ["critical", "high", "medium", "low", "info"],
          },
          note: {
            type: "string",
            description:
              "Empty unless the supervisor is overriding the worker's severity, in which case: why.",
          },
        },
      },
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT =
  `You supervise a fleet of specialist agents working a South African environmental licensing file for Silverline, an environmental compliance consultancy. The regulatory frame is NEM:WA (waste management licences under GN 921), NEMA and the 2014 EIA Regulations as amended, with the DFFE and provincial departments as competent authorities.

You are the agent that decides what deserves attention. Your value is judgement about what matters now, not coverage. A cycle that dispatches every specialist and returns thirty findings is a failure — the project lead stops reading. A cycle that surfaces the two things that will actually go wrong is a success.

Hard rules:
- Statutory deadlines outrank everything. A missed submission window can end an application; nothing else on the file is recoverable in the same way.
- Never invent a fact, date, reference number or requirement. If the state you were given does not say something, it is unknown, not absent.
- You propose. You never act outward. Nothing is ever sent, submitted or filed on the strength of your reasoning alone.`;

function planPrompt(state: string, roster: string): string {
  return `Here is the current state of the project:

${state}

Here are the specialists available to you:

${roster}

Decide which specialists to dispatch this cycle. Dispatch a specialist only when its question is genuinely live given the project's current stage and open findings — not because it is on the roster. For each one you dispatch, give it a focus narrow enough that it does not spend the cycle re-confirming things already settled. Record what you skip and why.`;
}

function collatePrompt(state: string, findings: string): string {
  return `Project state:

${state}

The specialists returned these findings this cycle:

${findings}

Rank them for the project lead and write the brief. Judge severity across the whole set, not finding by finding — a worker only sees its own question, you see all of them, and something that looks medium alone may be critical next to what another specialist found. Where you override a worker's severity, say why. Then write the brief: what changed, what is now most urgent, what needs a human decision this week.`;
}

// ---------------------------------------------------------------------------
// State gathering
// ---------------------------------------------------------------------------

async function loadProjectState(db: SupabaseClient, projectId: string) {
  const [project, deadlines, docs, activities, openFindings, dismissed] =
    await Promise.all([
      db.from("projects").select("*, client:clients(company_name)").eq(
        "id",
        projectId,
      ).maybeSingle(),
      db.from("project_deadlines").select("*").eq("project_id", projectId).order(
        "due_date",
      ),
      db.from("project_document_requirements").select("*").eq(
        "project_id",
        projectId,
      ),
      db.from("project_listed_activities").select("*").eq(
        "project_id",
        projectId,
      ),
      db.from("agent_findings").select(
        "id, agent_key, severity, title, detail, fingerprint, first_seen_at",
      ).eq("project_id", projectId).eq("state", "open"),
      db.from("agent_findings").select("fingerprint, title, resolution_note")
        .eq("project_id", projectId).eq("state", "dismissed"),
    ]);

  return {
    project: project.data,
    deadlines: deadlines.data ?? [],
    documents: docs.data ?? [],
    listedActivities: activities.data ?? [],
    openFindings: openFindings.data ?? [],
    // Fed to workers so they stop re-raising things a human already rejected.
    dismissed: dismissed.data ?? [],
  };
}

function renderState(s: Awaited<ReturnType<typeof loadProjectState>>): string {
  const p = s.project as Record<string, unknown> | null;
  if (!p) return "Project not found.";
  const today = new Date().toISOString().slice(0, 10);

  const deadlines = s.deadlines.map((d: Record<string, unknown>) => {
    const due = d.due_date as string | null;
    const days = due
      ? Math.round(
        (new Date(due).getTime() - new Date(today).getTime()) / 86_400_000,
      )
      : null;
    return `- ${d.name} — due ${due ?? "no date set"}${
      days === null ? "" : ` (${days} days${days < 0 ? " OVERDUE" : ""})`
    }, status ${d.status}`;
  }).join("\n") || "- none recorded";

  const missing = s.documents.filter((d: Record<string, unknown>) =>
    d.required && d.status === "missing"
  ).map((d: Record<string, unknown>) => `- ${d.name} (${d.linked_stage_key})`)
    .join("\n") || "- none";

  const open = s.openFindings.map((f: Record<string, unknown>) =>
    `- [${f.severity}] ${f.title} — raised by ${f.agent_key}, first seen ${
      String(f.first_seen_at).slice(0, 10)
    }`
  ).join("\n") || "- none";

  const dismissed = s.dismissed.map((f: Record<string, unknown>) =>
    `- ${f.title}${f.resolution_note ? ` — dismissed: ${f.resolution_note}` : ""}`
  ).join("\n") || "- none";

  return `Today is ${today}.

PROJECT: ${p.name}
Client: ${(p.client as { company_name?: string } | null)?.company_name ?? "—"}
Applicant: ${p.applicant ?? "—"}
Route: ${p.route ?? "—"}
Current legal stage: ${p.current_legal_stage ?? "—"}
Status: ${p.status} · progress ${p.progress ?? 0}%
Current step: ${p.current_step ?? "—"}
Next action: ${p.next_action ?? "—"}
Risk: ${p.risk_level ?? "—"} — ${p.risk_reason ?? "—"}

DEADLINES:
${deadlines}

REQUIRED DOCUMENTS STILL MISSING:
${missing}

LISTED ACTIVITIES ON FILE: ${s.listedActivities.length} recorded

FINDINGS STILL OPEN FROM PREVIOUS CYCLES:
${open}

PREVIOUSLY DISMISSED BY A HUMAN — do not raise these again unless the underlying facts have changed:
${dismissed}`;
}

// ---------------------------------------------------------------------------
// The cycle
// ---------------------------------------------------------------------------

async function runCycle(db: SupabaseClient, runId: string, projectId: string) {
  const patch = (fields: Record<string, unknown>) =>
    db.from("agent_runs").update(fields).eq("id", runId);

  try {
    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
    });

    await patch({
      status: "planning",
      status_note: "Reading the project state…",
      started_at: new Date().toISOString(),
      error_message: null,
    });

    const state = await loadProjectState(db, projectId);
    if (!state.project) throw new Error("Project not found.");
    const stateText = renderState(state);

    // --- Which specialists are even eligible for this project? --------------
    const { data: defs } = await db.from("agent_definitions").select("*").eq(
      "enabled",
      true,
    ).neq("key", "supervisor").order("sort_order");

    const route = state.project.route as string | null;
    const stage = state.project.current_legal_stage as string | null;
    const eligible = (defs ?? []).filter((d: Record<string, unknown>) => {
      const routes = (d.applies_to_routes ?? []) as string[];
      const stages = (d.applies_to_stages ?? []) as string[];
      if (routes.length && route && !routes.includes(route)) return false;
      if (stages.length && stage && !stages.includes(stage)) return false;
      return true;
    });
    if (eligible.length === 0) {
      throw new Error("No specialists are eligible for this project's route and stage.");
    }

    const roster = eligible.map((d: Record<string, unknown>) =>
      `- ${d.key} — ${d.name}: ${d.role}\n  ${d.description}`
    ).join("\n\n");

    // --- Plan ---------------------------------------------------------------
    const planResponse = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: PLAN_SCHEMA },
      },
      messages: [{ role: "user", content: planPrompt(stateText, roster) }],
    });
    const planText = planResponse.content.find((b) => b.type === "text");
    if (!planText || planText.type !== "text") {
      throw new Error("The supervisor returned no plan.");
    }
    const plan = JSON.parse(planText.text) as {
      situation: string;
      dispatch: { agent_key: string; reason: string; focus: string }[];
      skip: { agent_key: string; reason: string }[];
    };

    const eligibleKeys = new Set(eligible.map((d) => d.key as string));
    const toDispatch = plan.dispatch.filter((d) => eligibleKeys.has(d.agent_key));

    await patch({
      status: "dispatching",
      status_note: `${toDispatch.length} specialist${
        toDispatch.length === 1 ? "" : "s"
      } dispatched.`,
      plan,
    });

    if (toDispatch.length === 0) {
      await patch({
        status: "complete",
        status_note: "Nothing needed attention this cycle.",
        brief: plan.situation,
        finished_at: new Date().toISOString(),
      });
      return;
    }

    // --- Dispatch -----------------------------------------------------------
    const byKey = new Map(eligible.map((d) => [d.key as string, d]));
    const { data: tasks, error: taskErr } = await db.from("agent_tasks").insert(
      toDispatch.map((d) => ({
        run_id: runId,
        project_id: projectId,
        agent_key: d.agent_key,
        status: "pending",
        dispatch_reason: d.reason,
        input: {
          focus: d.focus,
          situation: plan.situation,
          state: stateText,
          dismissed: state.dismissed,
        },
      })),
    ).select("id, agent_key");
    if (taskErr) throw new Error(`Could not create tasks: ${taskErr.message}`);

    const functionsBase = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    await Promise.all((tasks ?? []).map(async (t: Record<string, unknown>) => {
      const def = byKey.get(t.agent_key as string);
      const fn = def?.edge_function as string;
      try {
        await fetch(`${functionsBase}/${fn}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ task_id: t.id }),
        });
      } catch (err) {
        // A worker that will not start is a task error, not a run error — the
        // rest of the cycle still has value.
        await db.from("agent_tasks").update({
          status: "error",
          error_message: `Could not start ${fn}: ${
            err instanceof Error ? err.message : String(err)
          }`,
          finished_at: new Date().toISOString(),
        }).eq("id", t.id as string);
      }
    }));

    await patch({ status: "working", status_note: "Specialists working…" });

    // --- Wait ---------------------------------------------------------------
    const deadline = Date.now() + WORKER_TIMEOUT_MS;
    const taskIds = (tasks ?? []).map((t) => t.id as string);
    let settled: Record<string, unknown>[] = [];
    while (Date.now() < deadline) {
      const { data: current } = await db.from("agent_tasks").select(
        "id, agent_key, status, output, error_message",
      ).in("id", taskIds);
      // Keep the last good read on a failed poll. `[].every()` is true, so
      // treating a dropped query as an empty task list would end the wait
      // immediately and collate while the workers are still writing.
      if (current && current.length === taskIds.length) {
        settled = current;
        if (
          settled.every((t) =>
            ["complete", "error", "skipped"].includes(t.status as string)
          )
        ) {
          break;
        }
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }

    // Anything still running when the clock runs out is marked and left behind.
    const stragglers = settled.filter((t) =>
      ["pending", "running"].includes(t.status as string)
    );
    if (stragglers.length) {
      await db.from("agent_tasks").update({
        status: "error",
        error_message: "Timed out waiting for this specialist.",
        finished_at: new Date().toISOString(),
      }).in("id", stragglers.map((t) => t.id as string));
    }

    // --- Collate ------------------------------------------------------------
    await patch({ status: "collating", status_note: "Merging findings…" });

    const { data: fresh } = await db.from("agent_findings").select(
      "id, agent_key, severity, title, detail, proposed_action",
    ).eq("run_id", runId);

    if (!fresh || fresh.length === 0) {
      const failed = settled.filter((t) => t.status === "error");
      await patch({
        status: "complete",
        status_note: failed.length
          ? `No findings — ${failed.length} specialist${
            failed.length === 1 ? "" : "s"
          } failed.`
          : "No findings — nothing needs attention.",
        brief: plan.situation,
        finished_at: new Date().toISOString(),
      });
      return;
    }

    const findingsText = fresh.map((f: Record<string, unknown>) =>
      `id: ${f.id}\nagent: ${f.agent_key}\nseverity as filed: ${f.severity}\ntitle: ${f.title}\ndetail: ${f.detail}\nproposed action: ${f.proposed_action}`
    ).join("\n\n---\n\n");

    const briefResponse = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: BRIEF_SCHEMA },
      },
      messages: [{
        role: "user",
        content: collatePrompt(stateText, findingsText),
      }],
    });
    const briefText = briefResponse.content.find((b) => b.type === "text");
    if (!briefText || briefText.type !== "text") {
      throw new Error("The supervisor returned no brief.");
    }
    const collated = JSON.parse(briefText.text) as {
      brief: string;
      ranked: { finding_id: string; severity: string; note: string }[];
    };

    // Apply supervisor severity overrides.
    const knownIds = new Set(fresh.map((f) => f.id as string));
    await Promise.all(
      collated.ranked
        .filter((r) => knownIds.has(r.finding_id))
        .map((r) =>
          db.from("agent_findings").update({
            severity: r.severity,
            detail: r.note
              ? `${
                fresh.find((f) => f.id === r.finding_id)?.detail ?? ""
              }\n\nSupervisor: ${r.note}`
              : undefined,
          }).eq("id", r.finding_id)
        ),
    );

    const failed = settled.filter((t) => t.status === "error").length;
    await patch({
      status: "complete",
      status_note: `${fresh.length} finding${fresh.length === 1 ? "" : "s"}${
        failed ? ` · ${failed} specialist${failed === 1 ? "" : "s"} failed` : ""
      }.`,
      brief: collated.brief,
      finished_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`agent-supervisor failed for run ${runId}:`, err);
    await patch({
      status: "error",
      status_note: null,
      error_message: err instanceof Error ? err.message : String(err),
      finished_at: new Date().toISOString(),
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
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let body: { project_id?: string; run_id?: string; trigger?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const isScheduler = authHeader === `Bearer ${serviceKey}`;

  // Scheduled runs come in with the service key; interactive runs come from a
  // signed-in staff member and are checked the same way the licence-audit
  // function checks its caller.
  if (!isScheduler) {
    const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Not authenticated" }, 401);
    const { data: profile } = await caller.from("profiles").select(
      "role, active",
    ).eq("id", user.id).maybeSingle();
    if (!profile || !profile.active || !["admin", "staff"].includes(profile.role)) {
      return json({ error: "Internal users only." }, 403);
    }
  }

  if (!Deno.env.get("ANTHROPIC_API_KEY")) {
    return json({ error: "ANTHROPIC_API_KEY is not configured on the server." }, 500);
  }

  const db = createClient(url, serviceKey);

  // Either resume a run row the UI already created, or open a new one.
  let runId = body.run_id ?? null;
  let projectId = body.project_id ?? null;

  if (runId) {
    const { data: run } = await db.from("agent_runs").select(
      "id, project_id, status",
    ).eq("id", runId).maybeSingle();
    if (!run) return json({ error: "Run not found" }, 404);
    if (!["queued", "error"].includes(run.status as string)) {
      return json({ error: "This run is already in progress." }, 409);
    }
    projectId = run.project_id as string;
  } else {
    if (!projectId) return json({ error: "project_id or run_id is required" }, 400);
    const { data: run, error } = await db.from("agent_runs").insert({
      project_id: projectId,
      trigger: isScheduler ? "scheduled" : (body.trigger ?? "manual"),
      status: "queued",
    }).select("id").single();
    if (error) return json({ error: error.message }, 500);
    runId = run.id as string;
  }

  if (!projectId) return json({ error: "Run has no project" }, 400);

  // @ts-ignore EdgeRuntime is provided by the Supabase edge runtime
  EdgeRuntime.waitUntil(runCycle(db, runId, projectId));

  return json({ started: true, run_id: runId }, 202);
});
