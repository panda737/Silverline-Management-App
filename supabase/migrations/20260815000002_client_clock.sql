-- ---------------------------------------------------------------------------
-- The statutory clock, client side.
--
-- Same idea as the staff missions' clock tab: every event anchored to the thing
-- that establishes it, so the client can see not just what happened but how we
-- know. An unanchored date looks fine on a dashboard right up until someone
-- relies on it.
--
-- Carries the same sensitivity control as project_facts, for the same reason:
-- a future reader has to see the judgement, not just its result.
-- ---------------------------------------------------------------------------

create table if not exists public.project_clock_events (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  -- Null where the step is expected but has no date yet.
  event_date    date,
  label         text not null,
  detail        text,
  -- What establishes it: "your payment of 27 July 2026", "Ruhan's email of
  -- 11 August". Where the date is ours rather than the authority's, say so here.
  source_note   text,
  --   done      it happened, on that date
  --   now       where the file stands today
  --   expected  a step still ahead, dated or not
  kind          text not null default 'done'
                check (kind in ('done', 'now', 'expected')),
  sort_order    integer not null default 0,
  sensitivity   text not null default 'internal_only'
                check (sensitivity in ('client_safe', 'internal_only', 'withheld')),
  sensitivity_note text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists project_clock_events_project_idx
  on public.project_clock_events (project_id, sort_order);

alter table public.project_clock_events enable row level security;

create policy "staff manage clock events"
  on public.project_clock_events for all
  to authenticated
  using (public.is_internal())
  with check (public.is_internal());

create policy "client reads own visible clock events"
  on public.project_clock_events for select
  to authenticated
  using (
    sensitivity = 'client_safe'
    and exists (
      select 1 from public.projects p
      where p.id = project_clock_events.project_id
        and p.client_id = public.my_client_id()
    )
  );

create or replace view public.portal_clock_events
with (security_barrier = true)
as
select
  e.id, e.project_id, e.event_date, e.label, e.detail,
  e.source_note, e.kind, e.sort_order
from public.project_clock_events e
join public.projects p on p.id = e.project_id
where e.sensitivity = 'client_safe'
  and p.client_id = public.my_client_id();

revoke all on public.portal_clock_events from anon;
grant select on public.portal_clock_events to authenticated;

comment on table public.project_clock_events is
  'The statutory clock as shown to a client. sensitivity decides what crosses; sensitivity_note records why.';
comment on column public.project_clock_events.source_note is
  'What establishes the event. Where a date is our arithmetic rather than the authority''s, say so here.';
