-- ============================================================================
-- Private storage bucket for project documents + policies mirroring the
-- documents table rules. Object paths follow the convention:
--   <project_id>/<random>-<filename>
-- The bucket is PRIVATE; files are only ever served via short-lived signed
-- URLs generated server-side with the requesting user's own session.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('project-documents', 'project-documents', false)
on conflict (id) do nothing;

-- Internal users (admin/staff) can read every object in the bucket.
create policy "project_documents_internal_read"
on storage.objects for select to authenticated
using (
  bucket_id = 'project-documents'
  and public.is_internal()
);

-- Client users can read an object only when a documents row marks it
-- client_visible AND the project belongs to their company.
create policy "project_documents_client_read"
on storage.objects for select to authenticated
using (
  bucket_id = 'project-documents'
  and exists (
    select 1
    from public.documents d
    join public.projects p on p.id = d.project_id
    where d.storage_path = storage.objects.name
      and d.client_visible = true
      and p.client_id = public.my_client_id()
  )
);

-- Uploads/updates/deletes: admins, or staff who can edit the project that the
-- first path segment (project id) refers to.
create policy "project_documents_editor_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-documents'
  and public.can_edit_project(((storage.foldername(name))[1])::uuid)
);

create policy "project_documents_editor_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'project-documents'
  and public.can_edit_project(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'project-documents'
  and public.can_edit_project(((storage.foldername(name))[1])::uuid)
);

create policy "project_documents_editor_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'project-documents'
  and public.can_edit_project(((storage.foldername(name))[1])::uuid)
);
