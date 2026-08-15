-- ---------------------------------------------------------------------------
-- Let a project be withheld from the client portal.
--
-- Until now the only thing keeping a project off a client's dashboard was its
-- status: the portal page filters out 'completed' and 'cancelled'. That is a
-- side effect, not a decision, and it fails both ways — a completed matter the
-- client SHOULD see is hidden, and a live matter we do not want in front of
-- him cannot be withheld at all. It also contradicts the portal's own empty
-- state, which promises "completed projects will continue to appear here for
-- reference".
--
-- Documents already have exactly this flag. Facts and clock events have the
-- three-way sensitivity column. Projects had nothing.
--
-- Default true: every existing project keeps showing. Withholding one is a
-- deliberate act, the same way promoting a document is.
-- ---------------------------------------------------------------------------

alter table public.projects
  add column if not exists client_visible boolean not null default true;

comment on column public.projects.client_visible is
  'Does this project appear on the client portal? Default true. Set false to withhold a matter from the client without falsifying its status. Facts and clock events on a withheld project remain in the record and stay readable to staff.';

-- The client predicate gains the flag; is_internal() is untouched, so the
-- staff Client View preview still renders a withheld project — otherwise there
-- would be no way to check what you had withheld.
create or replace view public.portal_projects as
  select p.id,
         p.name,
         p.project_type,
         p.status,
         p.priority,
         p.start_date,
         p.target_date,
         p.completed_date,
         p.client_summary,
         p.progress,
         p.created_at,
         p.updated_at,
         mgr.full_name as manager_name,
         p.sort_order
    from projects p
    left join profiles mgr on mgr.id = p.manager_id
   where (p.client_id = public.my_client_id() and p.client_visible)
      or public.is_internal();

-- Everything hanging off a project follows it. A client who cannot see the
-- project must not reach its stages, documents, facts, clock or questions by
-- guessing a URL.

create or replace view public.portal_timeline_items as
  select t.id, t.project_id, t.stage_name, t.status, t.description,
         t.due_date, t.completed_date, t.client_update_text, t.sort_order
    from project_timeline_items t
    join projects p on p.id = t.project_id
   where t.client_visible = true
     and ((p.client_id = public.my_client_id() and p.client_visible) or public.is_internal());

create or replace view public.portal_updates as
  select pc.id, pc.project_id, pc.body, pc.created_at,
         author.full_name as author_name, p.name as project_name
    from project_comments pc
    join projects p on p.id = pc.project_id
    left join profiles author on author.id = pc.author_id
   where pc.visibility = 'client'::comment_visibility
     and ((p.client_id = public.my_client_id() and p.client_visible) or public.is_internal());

create or replace view public.portal_documents as
  select d.id, d.project_id, d.name, d.doc_type, d.version, d.status,
         d.storage_path, d.created_at
    from documents d
    join projects p on p.id = d.project_id
   where d.client_visible = true
     and ((p.client_id = public.my_client_id() and p.client_visible) or public.is_internal());

create or replace view public.portal_facts as
  select f.id, f.project_id, f.section, f.label, f.value, f.source_note,
         f.sort_order, f.confirmable,
         r.state as response_state, r.comment as response_comment,
         r.created_at as responded_at
    from project_facts f
    join projects p on p.id = f.project_id
    left join lateral (
      select rr.state, rr.comment, rr.created_at
        from project_fact_responses rr
       where rr.fact_id = f.id
       order by rr.created_at desc
       limit 1
    ) r on true
   where f.sensitivity = 'client_safe'
     and ((p.client_id = public.my_client_id() and p.client_visible) or public.is_internal());

create or replace view public.portal_clock_events as
  select e.id, e.project_id, e.event_date, e.label, e.detail,
         e.source_note, e.kind, e.sort_order
    from project_clock_events e
    join projects p on p.id = e.project_id
   where e.sensitivity = 'client_safe'
     and ((p.client_id = public.my_client_id() and p.client_visible) or public.is_internal());

create or replace view public.portal_questions as
  select q.id, q.project_id, q.body, q.created_at,
         asker.full_name as asked_by_name,
         q.answer, q.answered_at, answerer.full_name as answered_by_name
    from public.project_questions q
    join public.projects p on p.id = q.project_id
    left join public.profiles asker    on asker.id = q.asked_by
    left join public.profiles answerer on answerer.id = q.answered_by
   where (p.client_id = public.my_client_id() and p.client_visible)
      or public.is_internal();

-- The write policies too: a client must not be able to ask a question or
-- upload onto a project that is not theirs to see.
create or replace function public.client_owns_project(pid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = pid
      and p.client_id = public.my_client_id()
      and p.client_visible
  );
$$;
