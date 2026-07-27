// chat — a conversational surface over the portal's own records.
//
// THE SECURITY MODEL, because it is the whole design:
//
//   Every tool below queries through `caller`, a Supabase client built from the
//   requesting user's own JWT. RLS therefore scopes what the assistant can read
//   to exactly what that person could already open in the UI. There is no second
//   permission model to keep in sync and no path by which the chat becomes a way
//   around RLS.
//
//   SUPABASE_SERVICE_ROLE_KEY IS DELIBERATELY NOT READ IN THIS FILE. If a future
//   change needs it, that change needs a rethink first — a service-role client
//   here would silently turn a chat box into a full database read for whoever
//   can log in.
//
// Grounding is by tool use, not by stuffing records into the prompt: the record
// set is far too large, it would go stale between turns, and it would invalidate
// the prompt cache on every message. The system prompt and tool schemas are a
// stable prefix with one cache breakpoint, so from the second turn onwards the
// fixed cost of a turn is a cache read. Volatile context (today's date, who is
// asking) goes in a mid-conversation system message *after* that prefix, which
// Opus 5 supports and which leaves the cached prefix byte-identical.
//
// Thinking stays ON (adaptive, summarized) and cost is controlled with
// `effort` instead. That is not a stylistic choice: with thinking disabled,
// Opus 5 occasionally writes a tool call into its visible text instead of
// emitting a tool_use block — the turn succeeds, the lookup silently never
// runs, and the answer is ungrounded with nothing to catch it. On a tool-heavy
// path that failure mode is unacceptable.
//
// Streaming: SSE frames, one JSON object per `data:` line, typed by `type`.
// The caller must use plain fetch — supabase.functions.invoke buffers.
//
// Secrets: ANTHROPIC_API_KEY (required). ANTHROPIC_MODEL / ANTHROPIC_EFFORT
// optional.
//
// Deploy: supabase functions deploy chat
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
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
const EFFORT = Deno.env.get("ANTHROPIC_EFFORT") || "medium";
const DOCUMENTS_BUCKET = "project-documents";

/** How many prior turns to replay. Older turns are dropped rather than
 *  summarised — a thread that long is better restarted with a fresh question,
 *  and silent summarisation would make the assistant cite things the reader
 *  can no longer see above it. */
const MAX_HISTORY_MESSAGES = 40;
/** Guard against a runaway tool loop. Each pass is one model call. */
const MAX_TOOL_PASSES = 8;
/** A licence pack PDF is routinely 5-15 MB; beyond this the request body gets
 *  unwieldy and the answer rarely improves. */
const MAX_DOC_BYTES = 12 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Tool schemas
//
// Strict JSON schema throughout, matching the convention already used in
// licence-review: additionalProperties false, every property required, and
// "absent" expressed as an empty string rather than an omitted key.
//
// STRICT MODE CONSTRAINS SHAPE, NOT MEANING. It guarantees a required string is
// present; it does not guarantee that string is a valid enum member or a uuid.
// An early run proved the point — the model put a fragment of its own tool-call
// syntax into `status`, which went straight into `.eq()` and came back as
// `invalid input value for enum project_status`. So:
//
//   1. Every closed value set is declared as a JSON Schema `enum` (with "" for
//      "any"), which makes an invalid value unrepresentable rather than merely
//      discouraged in prose.
//   2. Every id argument is checked against UUID_RE before it reaches a query,
//      because an id cannot be enumerated and a malformed one otherwise
//      surfaces as a Postgres syntax error instead of something the model can
//      act on.
// ---------------------------------------------------------------------------

const PROJECT_STATUSES = [
  "not_started",
  "in_progress",
  "waiting_on_client",
  "waiting_on_authority",
  "drafting",
  "submitted",
  "approved",
  "completed",
  "on_hold",
  "at_risk",
  "cancelled",
] as const;

const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;

const TASK_STATUSES = ["todo", "in_progress", "waiting", "review", "done"] as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TOOLS = [
  {
    name: "get_dashboard",
    description:
      "Portfolio overview across every project the user can see: counts by status, projects at risk, deadlines overdue or due soon, and each project's stated next action. Call this first for open-ended questions like 'what should we focus on' or 'what's urgent' — it is one query and it frames everything else.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: [],
      properties: {},
    },
  },
  {
    name: "search_projects",
    description:
      "Find projects by name, client, status or risk level. Use when the user names a project or client and you need its id before calling get_project.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["query", "status", "risk_level"],
      properties: {
        query: {
          type: "string",
          description:
            "Free text matched against project name and client company name. Empty string returns all.",
        },
        status: {
          type: "string",
          enum: ["", ...PROJECT_STATUSES],
          description: "Project status to filter by. Empty string for any.",
        },
        risk_level: {
          type: "string",
          enum: ["", ...RISK_LEVELS],
          description: "Risk level to filter by. Empty string for any.",
        },
      },
    },
  },
  {
    name: "get_project",
    description:
      "The full picture of one project: its status, route, legal stage, stated next action and risk, plus its timeline items, statutory deadlines, listed activities, document checklist, open tasks and filed documents. This is the tool that answers 'what's next on X' and 'where does X stand'.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["project_id"],
      properties: {
        project_id: { type: "string", description: "The project's uuid." },
      },
    },
  },
  {
    name: "list_tasks",
    description:
      "Tasks, filterable by project and status. Defaults to work that is still open.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["project_id", "status", "mine_only"],
      properties: {
        project_id: {
          type: "string",
          description: "Restrict to one project's uuid, or empty string for all.",
        },
        status: {
          type: "string",
          enum: ["", ...TASK_STATUSES],
          description:
            "Task status to filter by. Empty string for all still-open tasks (everything except done).",
        },
        mine_only: {
          type: "boolean",
          description: "True to return only tasks assigned to the person asking.",
        },
      },
    },
  },
  {
    name: "search_documents",
    description:
      "List filed documents by project and name. Returns metadata only — call read_document to actually read one.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["project_id", "query"],
      properties: {
        project_id: {
          type: "string",
          description: "Restrict to one project's uuid, or empty string for all.",
        },
        query: {
          type: "string",
          description:
            "Free text matched against the document name. Empty string returns all.",
        },
      },
    },
  },
  {
    name: "read_document",
    description:
      "Read a filed PDF in full. The document is attached to the conversation and you can then quote it, explain a condition, or check it against the project record. Read one document per turn and only when the answer genuinely depends on its contents — the metadata from search_documents is often enough.",
    strict: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["document_id"],
      properties: {
        document_id: { type: "string", description: "The document's uuid." },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Tool implementations. Every one of these runs under the caller's RLS.
// ---------------------------------------------------------------------------

/** A PDF pulled by read_document, to be attached to the next user turn. */
type PendingDoc = { name: string; base64: string };

type ToolOutcome = {
  /** What goes back to the model as the tool_result. */
  text: string;
  /** One-line note stored in chat_messages.tool_calls for the audit trail. */
  summary: string;
  document?: PendingDoc;
  isError?: boolean;
};

const fail = (message: string): ToolOutcome => ({
  text: message,
  summary: message,
  isError: true,
});

/** Reject a malformed id before it becomes a Postgres syntax error. Returns the
 *  failure to hand back, or null when the id is usable. Blank is allowed where
 *  the caller treats empty as "no filter". */
function badId(
  value: string,
  label: string,
  allowBlank = false
): ToolOutcome | null {
  if (allowBlank && !value) return null;
  if (UUID_RE.test(value)) return null;
  return fail(
    `"${value}" is not a valid ${label}. Use the id returned by a search tool rather than a name or a guess.`
  );
}

/** PostgREST wildcards are literal inside `ilike`, so a user typing `%` or `_`
 *  would otherwise silently widen their own search. Escape both, and the
 *  backslash that escapes them. */
const likeSafe = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");

async function getDashboard(db: SupabaseClient): Promise<ToolOutcome> {
  const { data: projects, error } = await db
    .from("projects")
    .select(
      "id, name, status, priority, progress, route, current_legal_stage, current_step, next_action, risk_level, risk_reason, due_date, target_date, clients(company_name)"
    )
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) return fail(`Could not read projects: ${error.message}`);

  const { data: deadlines, error: dErr } = await db
    .from("project_deadlines")
    .select("id, project_id, name, due_date, status, projects(name)")
    .in("status", ["running", "due_soon", "overdue"])
    .order("due_date", { ascending: true, nullsFirst: false });
  if (dErr) return fail(`Could not read deadlines: ${dErr.message}`);

  const live = (projects ?? []).filter(
    (p) => !["completed", "cancelled"].includes(p.status as string)
  );
  const byStatus: Record<string, number> = {};
  for (const p of live) {
    byStatus[p.status as string] = (byStatus[p.status as string] ?? 0) + 1;
  }

  const payload = {
    counts: {
      live_projects: live.length,
      total_projects: (projects ?? []).length,
      by_status: byStatus,
    },
    at_risk: live
      .filter((p) => ["high", "critical"].includes(p.risk_level as string))
      .map((p) => ({
        id: p.id,
        name: p.name,
        risk_level: p.risk_level,
        risk_reason: p.risk_reason,
        next_action: p.next_action,
        due_date: p.due_date,
      })),
    deadlines_needing_attention: (deadlines ?? []).map((d) => ({
      id: d.id,
      project_id: d.project_id,
      // The embedded row is typed loosely by PostgREST; the shape is a single
      // related row because project_id is a to-one FK.
      project: (d.projects as { name?: string } | null)?.name ?? null,
      name: d.name,
      due_date: d.due_date,
      status: d.status,
    })),
    projects: live.map((p) => ({
      id: p.id,
      name: p.name,
      client: (p.clients as { company_name?: string } | null)?.company_name ?? null,
      status: p.status,
      priority: p.priority,
      progress: p.progress,
      route: p.route,
      legal_stage: p.current_legal_stage,
      current_step: p.current_step,
      next_action: p.next_action,
      risk_level: p.risk_level,
      due_date: p.due_date,
      target_date: p.target_date,
    })),
  };

  return {
    text: JSON.stringify(payload),
    summary: `Portfolio: ${live.length} live project(s), ${payload.at_risk.length} at risk, ${payload.deadlines_needing_attention.length} deadline(s) needing attention`,
  };
}

async function searchProjects(
  db: SupabaseClient,
  input: { query: string; status: string; risk_level: string }
): Promise<ToolOutcome> {
  let q = db
    .from("projects")
    .select(
      "id, name, status, priority, progress, route, current_legal_stage, next_action, risk_level, due_date, applicant, clients(company_name)"
    );
  // Checked here as well as in the schema enum. The enum makes a bad value
  // unrepresentable only for as long as strict mode holds; this keeps the
  // invariant next to the query that depends on it.
  if (input.status) {
    if (!(PROJECT_STATUSES as readonly string[]).includes(input.status)) {
      return fail(
        `"${input.status}" is not a project status. Valid values: ${PROJECT_STATUSES.join(", ")} — or an empty string for any.`
      );
    }
    q = q.eq("status", input.status);
  }
  if (input.risk_level) {
    if (!(RISK_LEVELS as readonly string[]).includes(input.risk_level)) {
      return fail(
        `"${input.risk_level}" is not a risk level. Valid values: ${RISK_LEVELS.join(", ")} — or an empty string for any.`
      );
    }
    q = q.eq("risk_level", input.risk_level);
  }

  const { data, error } = await q.order("name");
  if (error) return fail(`Project search failed: ${error.message}`);

  // Name and client are filtered here rather than in the query: matching across
  // an embedded table needs an `or` over a joined column, which PostgREST only
  // supports with a referenced-table qualifier and which silently returns the
  // wrong rows if the relationship name changes. The project count is small.
  const needle = input.query.trim().toLowerCase();
  const rows = (data ?? [])
    .map((p) => ({
      id: p.id,
      name: p.name,
      client: (p.clients as { company_name?: string } | null)?.company_name ?? null,
      applicant: p.applicant,
      status: p.status,
      priority: p.priority,
      progress: p.progress,
      route: p.route,
      legal_stage: p.current_legal_stage,
      next_action: p.next_action,
      risk_level: p.risk_level,
      due_date: p.due_date,
    }))
    .filter(
      (p) =>
        !needle ||
        p.name.toLowerCase().includes(needle) ||
        (p.client ?? "").toLowerCase().includes(needle) ||
        (p.applicant ?? "").toLowerCase().includes(needle)
    );

  return {
    text: JSON.stringify({ count: rows.length, projects: rows }),
    summary: `Found ${rows.length} project(s)${input.query ? ` matching "${input.query}"` : ""}`,
  };
}

async function getProject(
  db: SupabaseClient,
  input: { project_id: string }
): Promise<ToolOutcome> {
  const id = input.project_id;
  const invalid = badId(id, "project id");
  if (invalid) return invalid;

  const { data: project, error } = await db
    .from("projects")
    .select("*, clients(id, company_name, industry)")
    .eq("id", id)
    .maybeSingle();
  if (error) return fail(`Could not read project: ${error.message}`);
  if (!project) {
    return fail(
      "No project with that id is visible to you. Use search_projects to find the right id."
    );
  }

  // Fired together: six independent reads, and the tool result is useless until
  // all of them land.
  const [timeline, deadlines, activities, docReqs, tasks, documents] =
    await Promise.all([
      db
        .from("project_timeline_items")
        .select(
          "id, stage_name, stage_key, status, description, due_date, completed_date, risk_flag, internal_notes, completion_requirements, sort_order"
        )
        .eq("project_id", id)
        .order("sort_order"),
      db
        .from("project_deadlines")
        .select(
          "id, deadline_key, name, linked_stage_key, trigger_date, due_date, status, notes, sort_order"
        )
        .eq("project_id", id)
        .order("sort_order"),
      db
        .from("project_listed_activities")
        .select(
          "id, activity_number, category, description, waste_stream, threshold, project_capacity, triggered, notes, sort_order"
        )
        .eq("project_id", id)
        .order("sort_order"),
      db
        .from("project_document_requirements")
        .select(
          "id, doc_key, name, linked_stage_key, required, status, na_reason, notes, sort_order"
        )
        .eq("project_id", id)
        .order("sort_order"),
      db
        .from("tasks")
        .select("id, title, status, priority, due_date, description, assigned_to")
        .eq("project_id", id)
        .neq("status", "done")
        .order("due_date", { ascending: true, nullsFirst: false }),
      db
        .from("documents")
        .select("id, name, doc_type, version, status, created_at, folder_id")
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const firstError = [timeline, deadlines, activities, docReqs, tasks, documents]
    .map((r) => r.error)
    .find(Boolean);
  if (firstError) {
    return fail(`Could not read project detail: ${firstError.message}`);
  }

  const payload = {
    project: {
      ...project,
      clients: undefined,
      client: project.clients ?? null,
    },
    timeline_items: timeline.data ?? [],
    deadlines: deadlines.data ?? [],
    listed_activities: activities.data ?? [],
    document_requirements: docReqs.data ?? [],
    open_tasks: tasks.data ?? [],
    documents: documents.data ?? [],
  };

  return {
    text: JSON.stringify(payload),
    summary: `Read project "${project.name}" — ${(timeline.data ?? []).length} timeline item(s), ${(deadlines.data ?? []).length} deadline(s), ${(tasks.data ?? []).length} open task(s), ${(documents.data ?? []).length} document(s)`,
  };
}

async function listTasks(
  db: SupabaseClient,
  input: { project_id: string; status: string; mine_only: boolean },
  userId: string
): Promise<ToolOutcome> {
  const invalid = badId(input.project_id, "project id", true);
  if (invalid) return invalid;

  let q = db
    .from("tasks")
    .select(
      "id, project_id, title, description, status, priority, due_date, assigned_to, projects(name)"
    );
  if (input.project_id) q = q.eq("project_id", input.project_id);
  if (input.status) {
    if (!(TASK_STATUSES as readonly string[]).includes(input.status)) {
      return fail(
        `"${input.status}" is not a task status. Valid values: ${TASK_STATUSES.join(", ")} — or an empty string for all open tasks.`
      );
    }
    q = q.eq("status", input.status);
  } else {
    q = q.neq("status", "done");
  }
  if (input.mine_only) q = q.eq("assigned_to", userId);

  const { data, error } = await q.order("due_date", {
    ascending: true,
    nullsFirst: false,
  });
  if (error) return fail(`Task lookup failed: ${error.message}`);

  const rows = (data ?? []).map((t) => ({
    id: t.id,
    project_id: t.project_id,
    project: (t.projects as { name?: string } | null)?.name ?? null,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    due_date: t.due_date,
    assigned_to_me: t.assigned_to === userId,
  }));

  return {
    text: JSON.stringify({ count: rows.length, tasks: rows }),
    summary: `Found ${rows.length} task(s)`,
  };
}

async function searchDocuments(
  db: SupabaseClient,
  input: { project_id: string; query: string }
): Promise<ToolOutcome> {
  const invalid = badId(input.project_id, "project id", true);
  if (invalid) return invalid;

  let q = db
    .from("documents")
    .select(
      "id, project_id, name, doc_type, version, status, storage_path, created_at, projects(name)"
    );
  if (input.project_id) q = q.eq("project_id", input.project_id);
  if (input.query.trim()) q = q.ilike("name", `%${likeSafe(input.query.trim())}%`);

  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return fail(`Document search failed: ${error.message}`);

  const rows = (data ?? []).map((d) => ({
    id: d.id,
    project_id: d.project_id,
    project: (d.projects as { name?: string } | null)?.name ?? null,
    name: d.name,
    doc_type: d.doc_type,
    version: d.version,
    status: d.status,
    created_at: d.created_at,
    // Tells the model up front whether read_document can do anything with it,
    // so it does not burn a turn discovering the file is a spreadsheet.
    readable: !!(d.storage_path as string | null)?.toLowerCase().endsWith(".pdf"),
  }));

  return {
    text: JSON.stringify({ count: rows.length, documents: rows }),
    summary: `Found ${rows.length} document(s)${input.query ? ` matching "${input.query}"` : ""}`,
  };
}

async function readDocument(
  db: SupabaseClient,
  input: { document_id: string }
): Promise<ToolOutcome> {
  const invalid = badId(input.document_id, "document id");
  if (invalid) return invalid;

  const { data: doc, error } = await db
    .from("documents")
    .select("id, name, storage_path, doc_type, project_id")
    .eq("id", input.document_id)
    .maybeSingle();
  if (error) return fail(`Could not look up the document: ${error.message}`);
  if (!doc) {
    return fail(
      "No document with that id is visible to you. Use search_documents to find the right id."
    );
  }

  const path = doc.storage_path as string | null;
  if (!path) return fail(`"${doc.name}" has no stored file.`);
  if (!path.toLowerCase().endsWith(".pdf")) {
    return fail(
      `"${doc.name}" is not a PDF, so it cannot be read directly. Describe it from its metadata, or ask the user to convert it.`
    );
  }

  // Storage RLS applies to this download exactly as it does to the table read
  // above — the caller's own token is on the client.
  const { data: blob, error: dlErr } = await db.storage
    .from(DOCUMENTS_BUCKET)
    .download(path);
  if (dlErr || !blob) {
    return fail(
      `Could not download "${doc.name}": ${dlErr?.message ?? "no file returned"}`
    );
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (bytes.byteLength > MAX_DOC_BYTES) {
    return fail(
      `"${doc.name}" is ${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB, over the ${MAX_DOC_BYTES / 1024 / 1024} MB limit for reading in a conversation. Open it in the Documents tab instead.`
    );
  }

  return {
    text: `Fetched "${doc.name}" (${(bytes.byteLength / 1024).toFixed(0)} KB). The PDF is attached to this turn — read it directly.`,
    summary: `Read document "${doc.name}"`,
    document: { name: doc.name as string, base64: encodeBase64(bytes) },
  };
}

async function runTool(
  db: SupabaseClient,
  userId: string,
  name: string,
  rawInput: unknown
): Promise<ToolOutcome> {
  // strict:true guarantees these fields are present and are strings. It does NOT
  // guarantee the values mean anything, so each tool validates enums and ids
  // itself before querying.
  const input = (rawInput ?? {}) as Record<string, never>;
  try {
    switch (name) {
      case "get_dashboard":
        return await getDashboard(db);
      case "search_projects":
        return await searchProjects(db, input as unknown as {
          query: string;
          status: string;
          risk_level: string;
        });
      case "get_project":
        return await getProject(db, input as unknown as { project_id: string });
      case "list_tasks":
        return await listTasks(
          db,
          input as unknown as {
            project_id: string;
            status: string;
            mine_only: boolean;
          },
          userId
        );
      case "search_documents":
        return await searchDocuments(db, input as unknown as {
          project_id: string;
          query: string;
        });
      case "read_document":
        return await readDocument(db, input as unknown as { document_id: string });
      default:
        return fail(`Unknown tool: ${name}`);
    }
  } catch (e) {
    // A thrown tool must still come back as a tool_result, or the conversation
    // is left with an unanswered tool_use block and the next request 400s.
    return fail(`${name} failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ---------------------------------------------------------------------------
// System prompt — the stable, cached prefix. Nothing per-request goes in here.
// ---------------------------------------------------------------------------

function systemPrompt(pinned: { id: string; name: string } | null): string {
  return `You are the Silverline project assistant, working inside Silverline's own management portal.

Silverline is a South African environmental compliance consultancy. Its work is regulatory licensing and compliance: waste management licences under NEM:WA, environmental authorisations and S&EIR processes under NEMA and the 2014 EIA Regulations, atmospheric emission licences under NEM:AQA, section 24G rectifications, section 31L enforcement responses, norms-and-standards registrations, and licence compliance audits. The people you are talking to are Silverline staff. Assume professional fluency: they know what an I&AP register is and do not need the acronym expanded.

## What you can see

You answer from the portal's records, which you reach through your tools. You cannot see anything the person asking cannot already see — the tools run under their own database permissions — so if a tool returns nothing, say so rather than guessing at what might be there.

## How to answer

Start with get_dashboard for anything open-ended ("what's urgent", "what should we focus on", "where do things stand"). It is one query and it tells you which projects deserve the follow-up.

Ground every specific claim in a tool result. Dates, deadlines, statuses, capacities, condition numbers and document names must come from the records, never from your own knowledge of how these processes usually go. If the record does not say, the answer is that the record does not say — that is genuinely useful, because a missing next action or an unanchored deadline is exactly the kind of gap worth surfacing.

Distinguish clearly between three things, because conflating them is how a licensing file goes wrong:
- what the record states,
- what you infer from it, and
- what is absent from it.

Never state a statutory deadline as fact unless a tool returned it. If you reason from a regulation to a date, say that you are doing so and name the regulation, so a human can check it.

Lead with the answer. A question about one project's status gets the status, then the supporting detail — not a preamble about what you are about to look up. Write in complete sentences and prose; use a table only for genuinely tabular facts. Keep it brief without being cryptic: drop detail that would not change what the reader does next, rather than compressing sentences into fragments.

When you use read_document, quote the wording that matters rather than paraphrasing it. On a regulatory file the exact phrasing of a condition is the thing that binds, and a paraphrase can quietly change its scope.

## What you do not do

You observe, reason and propose. You do not take outward-facing action, and you have no tool that could: you cannot email anyone, submit anything to an authority, or change a project record. If something needs doing, say what and by when, and leave the doing to a person. That boundary is deliberate — this is a regulatory file where a wrong outward action is not recoverable.${
    pinned
      ? `

## This conversation

This thread is pinned to the project "${pinned.name}" (id ${pinned.id}). Answer about that engagement unless the user clearly asks about something else; you still have your full tool set if they do.`
      : ""
  }`;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

type AnyBlock = Record<string, unknown>;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  if (!Deno.env.get("ANTHROPIC_API_KEY")) {
    return json({ error: "ANTHROPIC_API_KEY is not set on this project." }, 500);
  }

  // The one client in this function. Anon key + the caller's own bearer token,
  // so every read below is RLS-scoped to them.
  const caller = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
      auth: { persistSession: false },
    }
  );

  const {
    data: { user },
  } = await caller.auth.getUser();
  if (!user) return json({ error: "Not authenticated" }, 401);

  const { data: profile } = await caller
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.active || !["admin", "staff"].includes(profile.role as string)) {
    return json({ error: "Internal staff only." }, 403);
  }

  let body: { thread_id?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!body.thread_id) return json({ error: "thread_id is required" }, 400);
  if (!body.message?.trim()) return json({ error: "message is required" }, 400);
  const userText = body.message.trim();

  // RLS does the authorisation: a thread belonging to someone else simply is
  // not visible, so there is no ownership check to write here.
  const { data: thread } = await caller
    .from("chat_threads")
    .select("id, project_id")
    .eq("id", body.thread_id)
    .maybeSingle();
  if (!thread) return json({ error: "Conversation not found" }, 404);

  let pinned: { id: string; name: string } | null = null;
  if (thread.project_id) {
    const { data: p } = await caller
      .from("projects")
      .select("id, name")
      .eq("id", thread.project_id)
      .maybeSingle();
    if (p) pinned = { id: p.id as string, name: p.name as string };
  }

  const { data: history } = await caller
    .from("chat_messages")
    .select("role, content")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true })
    .limit(MAX_HISTORY_MESSAGES);

  // Persist the user's turn before streaming, so a dropped connection still
  // leaves the question on the record rather than losing it.
  const { error: insErr } = await caller.from("chat_messages").insert({
    thread_id: thread.id,
    role: "user",
    content: userText,
  });
  if (insErr) return json({ error: `Could not save message: ${insErr.message}` }, 500);

  const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
  const encoder = new TextEncoder();

  // Set when the browser goes away mid-turn — the reader navigated, switched
  // tab, or pressed stop. Generation deliberately continues (the answer is still
  // worth persisting) but nothing may touch the controller again: enqueueing
  // into a cancelled stream throws "the stream controller cannot close or
  // enqueue", and that throw would otherwise be caught below and recorded as
  // the turn's failure — burying a perfectly good answer under an error that
  // describes the reader leaving rather than anything going wrong.
  let clientGone = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, payload: Record<string, unknown> = {}) => {
        if (clientGone) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, ...payload })}\n\n`)
          );
        } catch {
          clientGone = true;
        }
      };

      let answer = "";
      const toolTrace: { name: string; input: unknown; summary: string }[] = [];
      let inTok = 0;
      let outTok = 0;
      let cacheTok = 0;
      let failure: string | null = null;

      try {
        const messages: AnyBlock[] = [
          ...(history ?? [])
            .filter((m) => (m.content as string)?.trim())
            .map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: userText },
          // Volatile context sits AFTER the cached prefix as a mid-conversation
          // system message (Opus 5). Putting the date in the system prompt
          // instead would change the cached prefix every single day.
          {
            role: "system",
            content: `Today is ${new Date().toISOString().slice(0, 10)}. You are speaking with ${profile.full_name || "a Silverline staff member"} (${profile.role}), whose user id is ${user.id} — use that id when a tool needs "assigned to me".`,
          },
        ];

        for (let pass = 0; pass < MAX_TOOL_PASSES; pass++) {
          const modelStream = anthropic.messages.stream({
            model: MODEL,
            max_tokens: 64000,
            thinking: { type: "adaptive", display: "summarized" },
            output_config: { effort: EFFORT },
            system: [
              {
                type: "text",
                text: systemPrompt(pinned),
                // Tools render before system, so this single breakpoint caches
                // the tool schemas and the system prompt together.
                cache_control: { type: "ephemeral" },
              },
            ],
            tools: TOOLS,
            messages,
            // deno-lint-ignore no-explicit-any
          } as any);

          for await (const event of modelStream) {
            if (event.type !== "content_block_delta") continue;
            const delta = event.delta as { type: string; text?: string; thinking?: string };
            if (delta.type === "text_delta" && delta.text) {
              answer += delta.text;
              send("text", { text: delta.text });
            } else if (delta.type === "thinking_delta" && delta.thinking) {
              send("thinking", { text: delta.thinking });
            }
          }

          const msg = await modelStream.finalMessage();
          inTok += msg.usage?.input_tokens ?? 0;
          outTok += msg.usage?.output_tokens ?? 0;
          cacheTok += msg.usage?.cache_read_input_tokens ?? 0;

          if (msg.stop_reason === "refusal") {
            failure =
              "The model declined to answer that. Rephrasing usually resolves it; if it does not, the question may be hitting a safety classifier.";
            break;
          }
          if (msg.stop_reason !== "tool_use") break;

          const calls = msg.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );
          messages.push({ role: "assistant", content: msg.content });

          const results: AnyBlock[] = [];
          const docs: AnyBlock[] = [];
          for (const call of calls) {
            const name = call.name;
            send("tool", { name });
            const outcome = await runTool(caller, user.id, name, call.input);
            toolTrace.push({ name, input: call.input, summary: outcome.summary });
            send("tool_done", { name, summary: outcome.summary });
            results.push({
              type: "tool_result",
              tool_use_id: call.id,
              content: outcome.text,
              ...(outcome.isError ? { is_error: true } : {}),
            });
            if (outcome.document) {
              docs.push({
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: outcome.document.base64,
                },
                title: outcome.document.name,
              });
            }
          }
          // Every tool_use from the turn above gets a matching result here, even
          // when it failed — an unanswered tool_use makes the next request
          // invalid.
          messages.push({ role: "user", content: results });

          // A fetched PDF goes in its OWN user message rather than alongside the
          // tool_result blocks. Consecutive same-role messages are explicitly
          // combined into one turn by the API, so this reads identically to the
          // model — but it keeps the tool_result message to nothing but
          // tool_result blocks, which is the shape the API documents. Mixing a
          // document block into that message would probably also work; "probably"
          // is not a good enough reason when the safe shape is free.
          if (docs.length) {
            messages.push({
              role: "user",
              content: [
                ...docs,
                {
                  type: "text",
                  text: "The document requested above is attached. Read it and answer from its actual wording.",
                },
              ],
            });
          }
        }
      } catch (e) {
        failure = e instanceof Error ? e.message : String(e);
      }

      // Save the assistant turn whatever happened. A visible half-answer with a
      // recorded error beats a thread that silently loses a turn on reload.
      const { error: saveErr } = await caller.from("chat_messages").insert({
        thread_id: thread.id,
        role: "assistant",
        content: answer,
        tool_calls: toolTrace,
        error_message: failure,
        model: MODEL,
        input_tokens: inTok,
        output_tokens: outTok,
        cache_read_tokens: cacheTok,
      });

      if (failure) send("error", { message: failure });
      send("done", {
        usage: {
          input_tokens: inTok,
          output_tokens: outTok,
          cache_read_tokens: cacheTok,
        },
        save_error: saveErr?.message ?? null,
      });
      if (!clientGone) {
        try {
          controller.close();
        } catch {
          // Already closed from the other end — nothing to do.
        }
      }
    },
    cancel() {
      clientGone = true;
    },
  });

  return new Response(stream, {
    headers: {
      ...CORS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
