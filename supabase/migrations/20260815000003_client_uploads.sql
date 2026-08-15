-- ---------------------------------------------------------------------------
-- Let the client answer, and let the client upload.
--
-- Until now a client could only read. Everything they gave us arrived by email,
-- into one person's mailbox, and reached the record only if that person
-- forwarded it. This is the fix: an upload lands in one place, on the project,
-- with a date on it, visible to everyone.
--
-- Three changes:
--   1. a 'team' section on project_facts, so the Brief can say who the EAP is
--   2. clients may insert a documents row on their own project
--   3. clients may write objects into their own project's storage folder
-- ---------------------------------------------------------------------------

-- 1 --------------------------------------------------------------------------

alter table public.project_facts
  drop constraint if exists project_facts_section_check;

alter table public.project_facts
  add constraint project_facts_section_check
  check (section in ('team', 'operation', 'evidence', 'outstanding', 'commencement'));

-- 2 --------------------------------------------------------------------------
-- A client may add a document to their own project, and only as client_visible
-- — they cannot upload something we then cannot see, and they cannot mark a
-- file internal. uploaded_by must be themselves, so the record of who sent what
-- cannot be forged.

create policy "client uploads to own project"
  on public.documents for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and client_visible = true
    and exists (
      select 1 from public.projects p
      where p.id = documents.project_id
        and p.client_id = public.my_client_id()
    )
  );

-- Deliberately no update and no delete for clients. Once something is sent it
-- stays sent; if it was wrong they upload a corrected version and say so.

-- 3 --------------------------------------------------------------------------
-- Storage. Same path convention as staff uploads, <project_id>/<file>, so the
-- existing client read policy keeps working unchanged.

create policy "project_documents_client_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-documents'
  and exists (
    select 1 from public.projects p
    where p.id = ((storage.foldername(name))[1])::uuid
      and p.client_id = public.my_client_id()
  )
);

comment on policy "client uploads to own project" on public.documents is
  'Clients may add documents to their own project, always client_visible, always attributed to themselves. No update, no delete — a sent document stays sent.';
