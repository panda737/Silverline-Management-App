-- ---------------------------------------------------------------------------
-- Let the client ask US something.
--
-- The portal already lets a client confirm a fact, correct a fact, and send a
-- document. Every one of those is a REPLY — the conversation only ever starts
-- from our side. So a client with a question still has to email one person and
-- hope it reaches the record, which is the failure this whole surface exists to
-- close.
--
-- One question, one answer, deliberately. Not a chat. A question that needs a
-- conversation needs a call, and a client who wants to add something can ask
-- again — cheaper than building a thread nobody reads back.
--
-- ⛔ AN ANSWER GOES STRAIGHT TO THE CLIENT. There is no draft state and no
-- approval step here by design: whoever writes it is publishing it. The staff
-- UI says so above the box. No agent answers a client — AGENTS.md §7.
-- ---------------------------------------------------------------------------

create table if not exists public.project_questions (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  body          text not null check (length(btrim(body)) > 0),
  asked_by      uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),

  -- Null until someone answers. answered_at is what the client sees as the
  -- date, so it is set with the answer rather than derived from updated_at.
  answer        text,
  answered_by   uuid references auth.users(id) on delete set null,
  answered_at   timestamptz,

  updated_at    timestamptz not null default now(),

  -- An answer without an author or a date is an orphan on the record.
  constraint project_questions_answer_complete check (
    (answer is null and answered_by is null and answered_at is null)
    or (answer is not null and answered_at is not null)
  )
);

create index if not exists project_questions_project_idx
  on public.project_questions (project_id, created_at desc);

-- Unanswered first, so the staff list surfaces what is waiting.
create index if not exists project_questions_open_idx
  on public.project_questions (project_id) where answer is null;

alter table public.project_questions enable row level security;

-- --- staff -----------------------------------------------------------------
-- Staff read every question and may answer. They may not forge who asked.

create policy "staff read questions"
  on public.project_questions for select
  to authenticated
  using (public.is_internal());

create policy "staff answer questions"
  on public.project_questions for update
  to authenticated
  using (public.is_internal())
  with check (public.is_internal());

-- Staff may also ask on a client's behalf — a question that came in by phone
-- belongs on the record like any other.
create policy "staff add questions"
  on public.project_questions for insert
  to authenticated
  with check (public.is_internal());

-- --- client ----------------------------------------------------------------
-- A client may ask on their own project and read the thread. They may NOT
-- update: not their own question once asked, and emphatically not the answer.
-- No delete either — the record of what was asked, and when, is the point.
--
-- Note client_owns_project() rather than an inline subquery against
-- public.projects. A client cannot SELECT that table, so an inline subquery
-- silently denies every write. That mistake cost a working confirm button that
-- reported success and recorded nothing.

create policy "client asks on own project"
  on public.project_questions for insert
  to authenticated
  with check (
    asked_by = auth.uid()
    and answer is null
    and public.client_owns_project(project_id)
  );

create policy "client reads own questions"
  on public.project_questions for select
  to authenticated
  using (public.client_owns_project(project_id));

-- --- portal view -----------------------------------------------------------
-- Names resolved here, because a client cannot read public.profiles. Carries
-- is_internal() alongside the client predicate so the staff Client View
-- preview renders the same rows the client sees.

create or replace view public.portal_questions
with (security_barrier = true)
as
select
  q.id,
  q.project_id,
  q.body,
  q.created_at,
  asker.full_name    as asked_by_name,
  q.answer,
  q.answered_at,
  answerer.full_name as answered_by_name
from public.project_questions q
join public.projects p on p.id = q.project_id
left join public.profiles asker    on asker.id = q.asked_by
left join public.profiles answerer on answerer.id = q.answered_by
where p.client_id = public.my_client_id() or public.is_internal();

comment on view public.portal_questions is
  'The client Q&A thread. Read by the client portal AND the staff Client View preview. Everything in it is by definition client-facing — a question the client wrote, and an answer written knowing they would read it.';

comment on table public.project_questions is
  'Questions the client asks us, and our answers. An answer here is published to the client the moment it is saved: no draft state, no approval step. Never answered by an agent.';
