-- ============================================================================
-- Project document folders
--
-- Every project gets the same standard folder set so a file lands in the same
-- place on every engagement and stays findable years later. The set mirrors how
-- a Silverline engagement actually runs:
--
--   Proposals & Quotes        what we sent the client to win/scope the work
--   Client Information        what the client gave us (site info, permits, plans)
--   Application & Reports     our drafts and final reports (EIR, EMPr, forms)
--   Specialist Studies        ecology, hydrology, heritage, traffic, air quality
--   Public Participation      notices, registers, comments, proof of process
--   Submissions to Authority  what WE sent out, and when (DFFE, DWS, province)
--   Authority Correspondence  what THEY sent us (acknowledgements, RFIs, queries)
--   Decisions & Licences      issued licences, EAs, amendments, appeal outcomes
--   Audits & Monitoring       audit reports, monitoring results, compliance reports
--   Invoices & Admin          invoices, POs, contracts
--   General                   anything that doesn't fit above
--
-- Folders are per-project and fully editable: rename them, add project-specific
-- ones ("Submission – Amendment Aug 2026"), delete the ones you don't use.
-- Deleting a folder never deletes files — they fall back to unfiled.
-- ============================================================================

create table public.project_folders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  -- stable key for the seeded template folders; null for user-created ones
  folder_key text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_project_folders_project
  on public.project_folders (project_id, sort_order);

-- One folder name per project (case-insensitive) so duplicates can't creep in.
create unique index idx_project_folders_unique_name
  on public.project_folders (project_id, lower(name));

create trigger set_updated_at before update on public.project_folders
  for each row execute function public.set_updated_at();

-- Files point at a folder; null = unfiled. Deleting a folder keeps the file.
alter table public.documents
  add column if not exists folder_id uuid
    references public.project_folders (id) on delete set null;

create index if not exists idx_documents_folder on public.documents (folder_id);

-- ----------------------------------------------------------------------------
-- RLS — mirrors the documents table: internal reads, project editors write.
-- Client users never touch this table; the portal keeps its flat file list.
-- ----------------------------------------------------------------------------
alter table public.project_folders enable row level security;

create policy "project_folders_select_internal"
on public.project_folders for select to authenticated
using (public.is_internal());

create policy "project_folders_insert_editor"
on public.project_folders for insert to authenticated
with check (public.can_edit_project(project_id));

create policy "project_folders_update_editor"
on public.project_folders for update to authenticated
using (public.can_edit_project(project_id))
with check (public.can_edit_project(project_id));

create policy "project_folders_delete_editor"
on public.project_folders for delete to authenticated
using (public.can_edit_project(project_id));

-- ----------------------------------------------------------------------------
-- Seed the standard set for a project (idempotent — safe to re-run)
-- ----------------------------------------------------------------------------
create or replace function public.seed_project_folders(pid uuid)
returns void
language sql
security definer set search_path = public
as $$
  insert into public.project_folders (project_id, name, folder_key, sort_order)
  values
    (pid, 'Proposals & Quotes',       'proposals',                10),
    (pid, 'Client Information',       'client_info',              20),
    (pid, 'Application & Reports',    'application',              30),
    (pid, 'Specialist Studies',       'specialist_studies',       40),
    (pid, 'Public Participation',     'ppp',                      50),
    (pid, 'Submissions to Authority', 'submissions',              60),
    (pid, 'Authority Correspondence', 'authority_correspondence', 70),
    (pid, 'Decisions & Licences',     'decisions_licences',       80),
    (pid, 'Audits & Monitoring',      'audits_monitoring',        90),
    (pid, 'Invoices & Admin',         'invoices_admin',          100),
    (pid, 'General',                  'general',                 110)
  on conflict do nothing;
$$;

-- New projects get the folder set automatically.
create or replace function public.on_project_created_seed_folders()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.seed_project_folders(new.id);
  return new;
end;
$$;

create trigger seed_folders_on_project_insert
  after insert on public.projects
  for each row execute function public.on_project_created_seed_folders();

-- Backfill every project that already exists.
do $$
declare
  p record;
begin
  for p in select id from public.projects loop
    perform public.seed_project_folders(p.id);
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Best-effort filing of documents uploaded before folders existed, by doc_type.
-- ----------------------------------------------------------------------------
update public.documents d
set folder_id = f.id
from public.project_folders f
where d.folder_id is null
  and f.project_id = d.project_id
  and f.folder_key = case d.doc_type
    when 'application'              then 'application'
    when 'draft_report'             then 'application'
    when 'final_report'             then 'application'
    when 'audit_report'             then 'audits_monitoring'
    when 'ppp_document'             then 'ppp'
    when 'authority_correspondence' then 'authority_correspondence'
    when 'client_information'       then 'client_info'
    when 'licence_approval'         then 'decisions_licences'
    when 'supporting_document'      then 'specialist_studies'
    else 'general'
  end;
