-- ============================================================================
-- Licence Audit module (internal-only tool)
--
-- Upload an issued environmental licence/permit PDF → the licence-review edge
-- function has Claude read it natively (classify document type, extract every
-- numbered condition verbatim with page refs) → auditors conduct the audit in
-- the app → a DFFE-ready external audit report is generated from the outcomes.
--
-- Replaces the external Make.com + CloudConvert + Google Sheets pipeline from
-- silverlinetools.co.za. Everything stays inside Supabase behind RLS.
--
-- Visibility: INTERNAL ONLY. No portal view selects from this table and no
-- policy grants client-role access — clients can never see licence audits.
-- ============================================================================

create table public.licence_audits (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,

  -- Source document
  file_name text not null default '',
  storage_path text not null default '',
  page_count integer,

  -- AI pipeline state (drives the live step UI while the edge function runs)
  processing_status text not null default 'uploaded'
    check (processing_status in ('uploaded', 'reading', 'extracting', 'ready', 'error')),
  processing_note text,
  error_message text,

  -- What the AI decided the document is
  doc_type text,
  doc_type_label text,
  doc_summary text,
  -- { licenceNumber, licenceHolder, facilityName, sector, location, issuingAuthority,
  --   issueDate, reviewDate, expiryDate, listedActivities: [] }
  metadata jsonb not null default '{}'::jsonb,

  -- The checklist: [{ title, items: [{ id, requirement, ref, page, auditable,
  --   status, observation, correctiveAction, priority, targetDate }] }]
  sections jsonb not null default '[]'::jsonb,

  -- Audit conduct + report fields
  audit_status text not null default 'in_progress'
    check (audit_status in ('in_progress', 'completed')),
  auditor_name text not null default '',
  audit_date date,
  exec_summary text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_licence_audits_created_at on public.licence_audits (created_at desc);
create index idx_licence_audits_client on public.licence_audits (client_id);

create trigger trg_licence_audits_updated_at
  before update on public.licence_audits
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS: internal staff only, full access. Service role bypasses RLS (edge fn).
-- ----------------------------------------------------------------------------
alter table public.licence_audits enable row level security;

create policy "licence_audits_internal_select"
on public.licence_audits for select to authenticated
using (public.is_internal());

create policy "licence_audits_internal_insert"
on public.licence_audits for insert to authenticated
with check (public.is_internal());

create policy "licence_audits_internal_update"
on public.licence_audits for update to authenticated
using (public.is_internal())
with check (public.is_internal());

create policy "licence_audits_internal_delete"
on public.licence_audits for delete to authenticated
using (public.is_internal());

-- ----------------------------------------------------------------------------
-- Private storage bucket for the licence PDFs. Paths: <audit_id>/<filename>.
-- Internal users only; files served via short-lived signed URLs.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('licence-pdfs', 'licence-pdfs', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

create policy "licence_pdfs_internal_read"
on storage.objects for select to authenticated
using (bucket_id = 'licence-pdfs' and public.is_internal());

create policy "licence_pdfs_internal_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'licence-pdfs' and public.is_internal());

create policy "licence_pdfs_internal_update"
on storage.objects for update to authenticated
using (bucket_id = 'licence-pdfs' and public.is_internal())
with check (bucket_id = 'licence-pdfs' and public.is_internal());

create policy "licence_pdfs_internal_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'licence-pdfs' and public.is_internal());
