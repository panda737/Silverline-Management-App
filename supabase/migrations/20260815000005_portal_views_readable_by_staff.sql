-- ---------------------------------------------------------------------------
-- Let internal users read the portal_* views, so the staff "Client View" tab
-- can render the REAL client components instead of imitating them.
--
-- Why this exists. The internal project page has a Client View tab captioned
-- "preview of what the client sees in their portal". It was a second,
-- hand-written imitation of the client portal, and by 15 August 2026 the two
-- had drifted: the preview still showed a completion percentage that had been
-- removed from the client portal on instruction, and still rendered the
-- summary, project manager and updates as separate blocks the client portal no
-- longer had. It showed LESS than the client actually gets, so it was not a
-- leak — but a staff member opening it to check what a client can see was
-- doing exactly the right thing and getting a wrong answer.
--
-- The fix is architectural, not cosmetic: there is now ONE client-facing
-- component reading ONE data source, and the staff tab renders it. For that to
-- work the views have to return rows for an internal user too.
--
-- What this does NOT do: it does not widen what a client can see. The client
-- predicate (p.client_id = my_client_id()) is untouched, and is_internal() is
-- false for a client, so their result set is byte-identical to before.
--
-- What it DOES grant: an internal user can now read the client_safe / client
-- visible projection of every project. That is the whole point — it is the
-- projection we want staff checking. Rows marked internal_only or withheld
-- stay outside these views for everyone, staff included.
-- ---------------------------------------------------------------------------

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
         mgr.full_name as manager_name
    from projects p
    left join profiles mgr on mgr.id = p.manager_id
   where p.client_id = public.my_client_id() or public.is_internal();

create or replace view public.portal_timeline_items as
  select t.id,
         t.project_id,
         t.stage_name,
         t.status,
         t.description,
         t.due_date,
         t.completed_date,
         t.client_update_text,
         t.sort_order
    from project_timeline_items t
    join projects p on p.id = t.project_id
   where t.client_visible = true
     and (p.client_id = public.my_client_id() or public.is_internal());

create or replace view public.portal_updates as
  select pc.id,
         pc.project_id,
         pc.body,
         pc.created_at,
         author.full_name as author_name,
         p.name as project_name
    from project_comments pc
    join projects p on p.id = pc.project_id
    left join profiles author on author.id = pc.author_id
   where pc.visibility = 'client'::comment_visibility
     and (p.client_id = public.my_client_id() or public.is_internal());

create or replace view public.portal_documents as
  select d.id,
         d.project_id,
         d.name,
         d.doc_type,
         d.version,
         d.status,
         d.storage_path,
         d.created_at
    from documents d
    join projects p on p.id = d.project_id
   where d.client_visible = true
     and (p.client_id = public.my_client_id() or public.is_internal());

create or replace view public.portal_facts as
  select f.id,
         f.project_id,
         f.section,
         f.label,
         f.value,
         f.source_note,
         f.sort_order,
         f.confirmable,
         r.state as response_state,
         r.comment as response_comment,
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
     and (p.client_id = public.my_client_id() or public.is_internal());

create or replace view public.portal_clock_events as
  select e.id,
         e.project_id,
         e.event_date,
         e.label,
         e.detail,
         e.source_note,
         e.kind,
         e.sort_order
    from project_clock_events e
    join projects p on p.id = e.project_id
   where e.sensitivity = 'client_safe'
     and (p.client_id = public.my_client_id() or public.is_internal());

comment on view public.portal_facts is
  'The client-safe projection of project_facts. Read by the client portal AND by the staff Client View preview, so the preview cannot drift from what the client actually sees. Never add a column here without deciding it is client-safe.';
