-- ---------------------------------------------------------------------------
-- FIX: every client policy that subqueried public.projects was broken.
--
-- Found by testing an upload as the client rather than trusting that it worked.
-- The policies read:
--
--     exists (select 1 from public.projects p
--             where p.id = <table>.project_id and p.client_id = my_client_id())
--
-- A client cannot SELECT public.projects — by design, they reach projects only
-- through the portal_projects view. So that subquery returns no rows for the
-- very person the policy is written for, and every one of them silently denied.
--
-- Reads happened to work because they go through the portal_* views, which are
-- security_barrier and owned by postgres, so they never consult the client's
-- own RLS on projects. Writes go straight at the tables, so they failed:
--   - client uploads: hard error, "new row violates row-level security policy"
--   - Correct / Not right: inserted nothing, silently, which is worse
--
-- The fix is one security definer helper, the same pattern as my_client_id(),
-- used everywhere instead of an inline subquery.
-- ---------------------------------------------------------------------------

create or replace function public.client_owns_project(pid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = pid
      and p.client_id = public.my_client_id()
  );
$$;

comment on function public.client_owns_project is
  'Does the signed-in client own this project? security definer, because a client cannot read public.projects directly — an inline subquery against it always returns false for them.';

-- --- documents --------------------------------------------------------------

drop policy if exists "client uploads to own project" on public.documents;

create policy "client uploads to own project"
  on public.documents for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and client_visible = true
    and public.client_owns_project(project_id)
  );

-- --- facts ------------------------------------------------------------------

drop policy if exists "client reads own visible facts" on public.project_facts;

create policy "client reads own visible facts"
  on public.project_facts for select
  to authenticated
  using (
    sensitivity = 'client_safe'
    and public.client_owns_project(project_id)
  );

drop policy if exists "client reads own responses" on public.project_fact_responses;

create policy "client reads own responses"
  on public.project_fact_responses for select
  to authenticated
  using (public.client_owns_project(project_id));

drop policy if exists "client responds to own visible facts" on public.project_fact_responses;

create policy "client responds to own visible facts"
  on public.project_fact_responses for insert
  to authenticated
  with check (
    responded_by = auth.uid()
    and public.client_owns_project(project_id)
    and exists (
      select 1 from public.project_facts f
      where f.id = project_fact_responses.fact_id
        and f.project_id = project_fact_responses.project_id
        and f.sensitivity = 'client_safe'
        and f.confirmable
    )
  );

-- --- clock ------------------------------------------------------------------

drop policy if exists "client reads own visible clock events" on public.project_clock_events;

create policy "client reads own visible clock events"
  on public.project_clock_events for select
  to authenticated
  using (
    sensitivity = 'client_safe'
    and public.client_owns_project(project_id)
  );

-- --- storage ----------------------------------------------------------------

drop policy if exists "project_documents_client_insert" on storage.objects;

create policy "project_documents_client_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-documents'
  and public.client_owns_project(((storage.foldername(name))[1])::uuid)
);
