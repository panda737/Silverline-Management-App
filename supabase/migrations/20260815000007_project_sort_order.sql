-- ---------------------------------------------------------------------------
-- Give a client's projects a deliberate order.
--
-- Verdex is now three projects, and they were rendering newest-first — so the
-- air leg, which has not started and is technically unready, sat at the top and
-- the Section 24G that everything actually waits on sat at the bottom. Creation
-- order is not the order the work runs in.
--
-- The sequence for Verdex is the sequence of the work:
--
--   1. Section 24G + WML      — the live matter; everything waits on it
--   2. Norms & Standards      — Category C, no fine, no cessation risk
--   3. Section 22A + AEL      — technically unready until the release point is
--                               known, and the leg that carries the cessation
--                               direction
--
-- Default 0, so every other project keeps its existing newest-first order.
-- ---------------------------------------------------------------------------

alter table public.projects
  add column if not exists sort_order integer not null default 0;

comment on column public.projects.sort_order is
  'Order of a client''s projects as the client should read them — normally the sequence the work runs in, not the order they were created. Ties fall back to created_at desc.';

update public.projects set sort_order = 1 where id = '6db92884-44b6-43e3-8518-218fb4260646'; -- s24G + WML
update public.projects set sort_order = 2 where id = '7117f7c6-e983-4582-9a8e-3174bace12de'; -- Norms & Standards
update public.projects set sort_order = 3 where id = '80b38fdc-431b-4fb7-96e0-be1e2b2a052e'; -- s22A + AEL

-- Expose it to the portal. Columns may only be appended by create or replace,
-- so sort_order goes last.
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
   where p.client_id = public.my_client_id() or public.is_internal();
