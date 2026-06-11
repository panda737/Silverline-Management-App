-- ============================================================================
-- Waste Management Licence (WML) Application module
--
-- Adds route-driven WML tracking to the project detail page:
--   * WML attributes on projects (route, applicant, legal stage, step, risk, …)
--   * Stage metadata on project_timeline_items (stage_key, completion reqs, risk)
--   * Three per-project tables: listed activities, document requirements, deadlines
--
-- Non-WML projects keep route = null and behave exactly as before. The only
-- change to existing behaviour is that the progress recompute trigger now skips
-- WML projects (route is not null) — their progress is weighted by legal stage
-- and set by the application instead of by completed-stage count.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- projects: WML attributes (all nullable → non-WML rows unaffected; the
-- portal_projects view selects explicit columns so none of this reaches clients)
-- ----------------------------------------------------------------------------
alter table public.projects
  add column if not exists route text
    check (route in ('category_a', 'category_b', 'category_c')),
  add column if not exists applicant text,
  add column if not exists current_legal_stage text,
  add column if not exists current_step text,
  add column if not exists next_action text,
  add column if not exists risk_level text
    check (risk_level in ('low', 'medium', 'high', 'critical')),
  add column if not exists risk_reason text,
  add column if not exists due_date date;

-- ----------------------------------------------------------------------------
-- project_timeline_items: stage metadata (assigned_to already = responsible)
-- ----------------------------------------------------------------------------
alter table public.project_timeline_items
  add column if not exists stage_key text,
  add column if not exists completion_requirements text,
  add column if not exists risk_flag boolean not null default false;

create index if not exists idx_timeline_items_stage_key
  on public.project_timeline_items (project_id, stage_key);

-- ----------------------------------------------------------------------------
-- Listed activities (NEMWA listed activities captured per project)
-- ----------------------------------------------------------------------------
create table if not exists public.project_listed_activities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  activity_number text not null default '',
  category text,
  description text,
  waste_stream text,
  threshold text,
  project_capacity text,
  triggered text not null default 'tbc' check (triggered in ('yes', 'no', 'tbc')),
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_listed_activities_project
  on public.project_listed_activities (project_id, sort_order);

-- ----------------------------------------------------------------------------
-- Document requirements (a checklist of expected documents per stage; separate
-- from `documents`, which stores actual uploaded files)
-- ----------------------------------------------------------------------------
create table if not exists public.project_document_requirements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  doc_key text,
  name text not null,
  linked_stage_key text,
  required boolean not null default true,
  status text not null default 'missing'
    check (status in ('missing', 'uploaded', 'approved', 'not_applicable')),
  na_reason text,
  upload_date date,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_doc_reqs_project
  on public.project_document_requirements (project_id, sort_order);

-- ----------------------------------------------------------------------------
-- Deadlines (statutory / process deadlines per project)
-- ----------------------------------------------------------------------------
create table if not exists public.project_deadlines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  deadline_key text,
  name text not null,
  linked_stage_key text,
  trigger_date date,
  due_date date,
  status text not null default 'not_started'
    check (status in ('not_started', 'running', 'due_soon', 'overdue', 'completed')),
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_deadlines_project
  on public.project_deadlines (project_id, sort_order);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
drop trigger if exists set_updated_at on public.project_listed_activities;
create trigger set_updated_at before update on public.project_listed_activities
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.project_document_requirements;
create trigger set_updated_at before update on public.project_document_requirements
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.project_deadlines;
create trigger set_updated_at before update on public.project_deadlines
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security (mirror project_timeline_items: internal read,
-- can_edit_project for writes)
-- ----------------------------------------------------------------------------
alter table public.project_listed_activities enable row level security;
alter table public.project_document_requirements enable row level security;
alter table public.project_deadlines enable row level security;

-- listed activities ----------------------------------------------------------
drop policy if exists "listed_activities_select_internal" on public.project_listed_activities;
create policy "listed_activities_select_internal" on public.project_listed_activities
  for select to authenticated using (public.is_internal());

drop policy if exists "listed_activities_insert_editors" on public.project_listed_activities;
create policy "listed_activities_insert_editors" on public.project_listed_activities
  for insert to authenticated with check (public.can_edit_project(project_id));

drop policy if exists "listed_activities_update_editors" on public.project_listed_activities;
create policy "listed_activities_update_editors" on public.project_listed_activities
  for update to authenticated using (public.can_edit_project(project_id))
  with check (public.can_edit_project(project_id));

drop policy if exists "listed_activities_delete_editors" on public.project_listed_activities;
create policy "listed_activities_delete_editors" on public.project_listed_activities
  for delete to authenticated using (public.can_edit_project(project_id));

-- document requirements ------------------------------------------------------
drop policy if exists "doc_reqs_select_internal" on public.project_document_requirements;
create policy "doc_reqs_select_internal" on public.project_document_requirements
  for select to authenticated using (public.is_internal());

drop policy if exists "doc_reqs_insert_editors" on public.project_document_requirements;
create policy "doc_reqs_insert_editors" on public.project_document_requirements
  for insert to authenticated with check (public.can_edit_project(project_id));

drop policy if exists "doc_reqs_update_editors" on public.project_document_requirements;
create policy "doc_reqs_update_editors" on public.project_document_requirements
  for update to authenticated using (public.can_edit_project(project_id))
  with check (public.can_edit_project(project_id));

drop policy if exists "doc_reqs_delete_editors" on public.project_document_requirements;
create policy "doc_reqs_delete_editors" on public.project_document_requirements
  for delete to authenticated using (public.can_edit_project(project_id));

-- deadlines ------------------------------------------------------------------
drop policy if exists "deadlines_select_internal" on public.project_deadlines;
create policy "deadlines_select_internal" on public.project_deadlines
  for select to authenticated using (public.is_internal());

drop policy if exists "deadlines_insert_editors" on public.project_deadlines;
create policy "deadlines_insert_editors" on public.project_deadlines
  for insert to authenticated with check (public.can_edit_project(project_id));

drop policy if exists "deadlines_update_editors" on public.project_deadlines;
create policy "deadlines_update_editors" on public.project_deadlines
  for update to authenticated using (public.can_edit_project(project_id))
  with check (public.can_edit_project(project_id));

drop policy if exists "deadlines_delete_editors" on public.project_deadlines;
create policy "deadlines_delete_editors" on public.project_deadlines
  for delete to authenticated using (public.can_edit_project(project_id));

-- ----------------------------------------------------------------------------
-- Progress recompute: skip WML projects (route is not null). Their progress is
-- weighted by legal stage and written by the application.
-- ----------------------------------------------------------------------------
create or replace function public.apply_project_progress(pid uuid)
returns void
language sql security definer set search_path = public
as $$
  update public.projects p
  set progress = coalesce((
    select round(
      100.0 * count(*) filter (where t.status = 'completed')
      / nullif(count(*) filter (where t.status <> 'skipped'), 0)
    )
    from public.project_timeline_items t
    where t.project_id = pid
  ), 0)::int
  where p.id = pid and p.route is null;
$$;
