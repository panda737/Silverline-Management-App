-- ============================================================================
-- Agent Fleet — the orchestrator + specialist workers that run a regulatory
-- project (WML / S&EIR) continuously instead of by memory.
--
-- Shape:
--   agent_runs      one row per supervisor cycle (scheduled or manual)
--   agent_tasks     one row per worker dispatch inside a run
--   agent_findings  what the fleet actually surfaces to a human, deduped
--                   across runs by fingerprint and acted on in the app
--
-- The supervisor edge function (`agent-supervisor`) opens a run, inspects each
-- project's live state, decides which workers to dispatch, and writes tasks.
-- Each worker edge function claims its task, calls Claude with a structured
-- output schema, and writes findings back. The UI polls agent_runs.status the
-- same way the licence-audit UI polls licence_audits.processing_status.
--
-- Agents NEVER take outward-facing action. They observe, reason and propose.
-- Every finding is a proposal a human accepts, edits or dismisses — nothing is
-- emailed, submitted or filed by an agent. That boundary is deliberate: this is
-- a regulatory file where a wrong outward action is not recoverable.
--
-- Visibility: INTERNAL ONLY. No portal_* view selects from these tables and no
-- policy grants the client role access.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type public.agent_run_status as enum (
  'queued',      -- created, supervisor has not started
  'planning',    -- supervisor is deciding what to dispatch
  'dispatching', -- tasks written, workers starting
  'working',     -- one or more workers still running
  'collating',   -- supervisor is merging findings into the brief
  'complete',
  'error'
);

create type public.agent_task_status as enum (
  'pending', 'running', 'complete', 'error', 'skipped'
);

create type public.agent_finding_severity as enum (
  'critical',  -- a statutory deadline or licence condition is at risk now
  'high',      -- will become critical without action this week
  'medium',    -- a gap worth closing
  'low',       -- housekeeping / consistency nit
  'info'       -- context the human should know, no action implied
);

create type public.agent_finding_state as enum (
  'open',        -- needs a human decision
  'acknowledged',-- seen, deliberately not acted on yet
  'actioned',    -- turned into a task or handled
  'dismissed',   -- rejected — feeds the agent's future suppression list
  'superseded'   -- a later run replaced it
);

-- The worker roster. Kept as a table (not an enum) so a new specialist can be
-- added by insert + deploying its function, without a migration.
create table public.agent_definitions (
  key text primary key,
  name text not null,
  role text not null,                       -- one line: what this agent is for
  description text not null default '',
  -- Which edge function serves this agent. All six specialists share the one
  -- `agent-worker` function and differ only by their prompt in
  -- functions/agent-worker/prompts.ts — one deploy, six behaviours. A future
  -- specialist that needs its own runtime (a different tool set, a longer
  -- timeout) can point at its own function without a schema change.
  edge_function text not null,              -- supabase/functions/<name>
  -- Which WML routes this agent applies to; empty = all routes.
  applies_to_routes text[] not null default '{}',
  -- Only dispatch when the project's current_legal_stage is in this list;
  -- empty = any stage.
  applies_to_stages text[] not null default '{}',
  -- Supervisor uses this to order dispatch; lower runs first.
  sort_order integer not null default 100,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Runs
-- ----------------------------------------------------------------------------
create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  -- null project_id = a portfolio-wide sweep across every active project
  triggered_by uuid references public.profiles (id) on delete set null,
  trigger text not null default 'manual'
    check (trigger in ('manual', 'scheduled', 'event')),

  status public.agent_run_status not null default 'queued',
  status_note text,
  error_message text,

  -- The supervisor's own reasoning, kept for auditability: why these agents,
  -- why this order, what it decided to skip.
  plan jsonb not null default '{}'::jsonb,
  -- The human-facing output of the run: a short brief + the ranked findings.
  brief text not null default '',

  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_agent_runs_project on public.agent_runs (project_id, created_at desc);
create index idx_agent_runs_status on public.agent_runs (status) where status <> 'complete';

-- ----------------------------------------------------------------------------
-- Tasks — one worker dispatch
-- ----------------------------------------------------------------------------
create table public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  agent_key text not null references public.agent_definitions (key),

  status public.agent_task_status not null default 'pending',
  status_note text,
  error_message text,
  -- Why the supervisor dispatched (or skipped) this worker.
  dispatch_reason text not null default '',

  -- What the supervisor handed the worker, and what came back.
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,

  -- Cost/observability — the supervisor uses these to keep a run bounded.
  model text,
  input_tokens integer,
  output_tokens integer,

  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_agent_tasks_run on public.agent_tasks (run_id);
create index idx_agent_tasks_project on public.agent_tasks (project_id, created_at desc);

-- ----------------------------------------------------------------------------
-- Findings — the only part a human reads day to day
-- ----------------------------------------------------------------------------
create table public.agent_findings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  run_id uuid references public.agent_runs (id) on delete set null,
  task_id uuid references public.agent_tasks (id) on delete set null,
  agent_key text references public.agent_definitions (key),

  severity public.agent_finding_severity not null default 'medium',
  state public.agent_finding_state not null default 'open',

  title text not null,
  detail text not null default '',
  -- What the agent proposes a human do. Never executed automatically.
  proposed_action text not null default '',
  -- Where the agent got this from: document names, page numbers, table rows,
  -- correspondence dates. A finding without evidence is not actionable.
  evidence jsonb not null default '[]'::jsonb,

  -- Stable hash of (project, agent, subject) so the same issue found on
  -- consecutive runs updates one row instead of piling up duplicates.
  fingerprint text not null,

  -- Optional links into the rest of the app.
  deadline_id uuid references public.project_deadlines (id) on delete set null,
  document_requirement_id uuid
    references public.project_document_requirements (id) on delete set null,
  task_created_id uuid references public.tasks (id) on delete set null,

  -- Set when a human resolves it, so dismissals can be fed back as context.
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  resolution_note text not null default '',

  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (project_id, fingerprint)
);

create index idx_agent_findings_open
  on public.agent_findings (project_id, severity, last_seen_at desc)
  where state = 'open';
create index idx_agent_findings_run on public.agent_findings (run_id);

-- ----------------------------------------------------------------------------
-- updated_at triggers (set_updated_at() comes from the initial schema)
-- ----------------------------------------------------------------------------
create trigger trg_agent_definitions_updated_at before update on public.agent_definitions
  for each row execute function public.set_updated_at();
create trigger trg_agent_runs_updated_at before update on public.agent_runs
  for each row execute function public.set_updated_at();
create trigger trg_agent_tasks_updated_at before update on public.agent_tasks
  for each row execute function public.set_updated_at();
create trigger trg_agent_findings_updated_at before update on public.agent_findings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS — internal staff only, read + resolve. Workers write via service role,
-- which bypasses RLS entirely, so no insert policy is granted to end users on
-- runs/tasks; humans only ever update finding state.
-- ----------------------------------------------------------------------------
alter table public.agent_definitions enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.agent_findings enable row level security;

create policy "agent_definitions_internal_select" on public.agent_definitions
  for select to authenticated using (public.is_internal());
create policy "agent_definitions_admin_write" on public.agent_definitions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "agent_runs_internal_select" on public.agent_runs
  for select to authenticated using (public.is_internal());
-- Staff may kick off a run from the UI; the edge function does the real work.
create policy "agent_runs_internal_insert" on public.agent_runs
  for insert to authenticated with check (public.is_internal());

create policy "agent_tasks_internal_select" on public.agent_tasks
  for select to authenticated using (public.is_internal());

create policy "agent_findings_internal_select" on public.agent_findings
  for select to authenticated using (public.is_internal());
create policy "agent_findings_internal_update" on public.agent_findings
  for update to authenticated using (public.is_internal()) with check (public.is_internal());

-- ----------------------------------------------------------------------------
-- The roster.
--
-- One supervisor, six specialists. Each specialist owns exactly one question so
-- its prompt stays small and its output stays checkable; the supervisor owns
-- sequencing, deduplication and the brief.
-- ----------------------------------------------------------------------------
insert into public.agent_definitions
  (key, name, role, description, edge_function, applies_to_routes, applies_to_stages, sort_order)
values
  ('supervisor',
   'Project Supervisor',
   'Decides what needs checking, dispatches the specialists, and writes the brief.',
   'Reads the project''s current stage, deadlines, document checklist and recent findings, then dispatches only the specialists whose question is live right now. Merges their findings, drops duplicates and anything a human previously dismissed, ranks what is left by severity and how close the statutory clock is, and writes a short brief. It never edits project data.',
   'agent-supervisor', '{}', '{}', 0),

  ('statutory-clock',
   'Statutory Clock',
   'Keeps every regulatory deadline anchored to the dates the authority actually stated.',
   'Reads authority correspondence (acknowledgement, acceptance and decision letters) and the project deadline table, and checks that every running clock is anchored to a real dated event rather than a default offset. Flags deadlines that have drifted, are unanchored, or are approaching without the deliverable being under way. This is the agent that must never be wrong: a missed statutory window can end an application.',
   'agent-worker', '{}', '{}', 10),

  ('ppp-registrar',
   'Public Participation Registrar',
   'Guards the I&AP register and the integrity of the participation record.',
   'Reconciles the I&AP register against notices served, comments received and responses issued. Flags registered parties who were never responded to, comment periods whose statutory minimum is not evidenced, notice placements missing proof of publication, and objectors whose escalation has no logged response. The participation record is the defence file if the process is ever challenged, so gaps here are treated as high severity.',
   'agent-worker', '{}', '{}', 20),

  ('comments-responses',
   'Comments and Responses Drafter',
   'Drafts responses to outstanding I&AP comments — for a human to check and send.',
   'For each unanswered comment, drafts a response grounded in the project''s own accepted positions (the scoping report, the WML application, the process descriptions) and flags any comment it cannot answer from the record. Output is always a draft; the agent never sends anything and never invents a technical commitment the file does not already make.',
   'agent-worker', '{}', '{}', 30),

  ('doc-completeness',
   'Document Completeness',
   'Checks the submission pack is complete and internally consistent before it goes out.',
   'Compares the document checklist for the current route and stage against what is actually filed, and reads the filed documents for cross-document consistency — the same site description, the same capacities, the same listed activities, the same waste streams everywhere. Inconsistency between the application form, the scoping report, the public notices and the technical annexures is the single biggest credibility risk on a licensing file.',
   'agent-worker', '{}', '{}', 40),

  ('specialist-studies',
   'Specialist Studies Tracker',
   'Tracks the Plan of Study for EIA through to delivered specialist reports.',
   'Holds the accepted Plan of Study as the source of truth: which specialist studies were committed to, their terms of reference, who is appointed, and what has been delivered. Flags studies not yet appointed against the EIR deadline, delivered reports whose scope does not match the committed terms of reference, and findings in a specialist report that contradict the project description.',
   'agent-worker', '{category_b}', '{}', 50),

  ('obligation-register',
   'Licence Obligation Register',
   'Turns granted licence conditions into a live compliance calendar.',
   'Once a licence is issued, converts every condition into a dated, owned, recurring obligation — monitoring, sampling, record-keeping, training, reporting — and thereafter flags obligations coming due or missed. Shares the condition-extraction pipeline already used by the Licence Audits tool.',
   'agent-worker', '{}',
   '{licence_conditions_captured,close_out,compliance_obligations_captured}', 60);
