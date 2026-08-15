-- ---------------------------------------------------------------------------
-- Client-facing facts, and the client's response to them.
--
-- The staff Mission Control pages read a static fixture (src/lib/demo/*). That
-- is fine for an internal narrative, but a client must never be shown a
-- fixture: it would be a second source of truth, presented to the one person
-- who can least check it. So the client Mission Control reads these tables.
--
-- The point of the surface is confirmation. We assert a fact, say where we got
-- it, and the applicant either confirms it or tells us it is wrong and why.
-- ---------------------------------------------------------------------------

create table if not exists public.project_facts (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  section       text not null check (section in ('operation', 'evidence', 'outstanding', 'commencement')),
  label         text not null,
  value         text,
  -- Where the assertion comes from, in the client's own terms: "your feedstock
  -- ledger, 13 July 2026". A fact with no provenance should not be put to a
  -- client for confirmation.
  source_note   text,
  sort_order    integer not null default 0,
  -- Defaults to hidden. Promoting a fact to the client side is a deliberate act,
  -- the same way document visibility works.
  client_visible boolean not null default false,
  -- Some rows are context rather than questions.
  confirmable   boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists project_facts_project_idx
  on public.project_facts (project_id, section, sort_order);

create table if not exists public.project_fact_responses (
  id            uuid primary key default gen_random_uuid(),
  fact_id       uuid not null references public.project_facts(id) on delete cascade,
  project_id    uuid not null references public.projects(id) on delete cascade,
  state         text not null check (state in ('confirmed', 'disputed')),
  comment       text,
  responded_by  uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists project_fact_responses_fact_idx
  on public.project_fact_responses (fact_id, created_at desc);

alter table public.project_facts          enable row level security;
alter table public.project_fact_responses enable row level security;

-- --- staff -----------------------------------------------------------------

create policy "staff manage facts"
  on public.project_facts for all
  to authenticated
  using (public.is_internal())
  with check (public.is_internal());

create policy "staff read responses"
  on public.project_fact_responses for select
  to authenticated
  using (public.is_internal());

-- --- client ----------------------------------------------------------------
-- A client may read only client_visible facts on their own project, and may
-- respond only to those same facts. They may never write a fact, and they may
-- never edit or delete a response once given — the record of what they said,
-- and when, is the point.

create policy "client reads own visible facts"
  on public.project_facts for select
  to authenticated
  using (
    client_visible
    and exists (
      select 1 from public.projects p
      where p.id = project_facts.project_id
        and p.client_id = public.my_client_id()
    )
  );

create policy "client reads own responses"
  on public.project_fact_responses for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_fact_responses.project_id
        and p.client_id = public.my_client_id()
    )
  );

create policy "client responds to own visible facts"
  on public.project_fact_responses for insert
  to authenticated
  with check (
    responded_by = auth.uid()
    and exists (
      select 1
      from public.project_facts f
      join public.projects p on p.id = f.project_id
      where f.id = project_fact_responses.fact_id
        and f.client_visible
        and f.confirmable
        and p.id = project_fact_responses.project_id
        and p.client_id = public.my_client_id()
    )
  );

-- --- portal view -----------------------------------------------------------
-- Mirrors the portal_* pattern: security_barrier, restricted to the signed-in
-- client's own company, carrying the latest response inline so the page can
-- render state without a second round trip.

create or replace view public.portal_facts
with (security_barrier = true)
as
select
  f.id, f.project_id, f.section, f.label, f.value, f.source_note,
  f.sort_order, f.confirmable,
  r.state       as response_state,
  r.comment     as response_comment,
  r.created_at  as responded_at
from public.project_facts f
join public.projects p on p.id = f.project_id
left join lateral (
  select state, comment, created_at
  from public.project_fact_responses rr
  where rr.fact_id = f.id
  order by rr.created_at desc
  limit 1
) r on true
where f.client_visible
  and p.client_id = public.my_client_id();

revoke all on public.portal_facts from anon;
grant select on public.portal_facts to authenticated;

comment on table public.project_facts is
  'Facts asserted to a client for confirmation. client_visible defaults to false — promoting a fact is deliberate.';
comment on table public.project_fact_responses is
  'The client''s confirmation or dispute. Insert-only: the record of what was said, and when, is the point.';
