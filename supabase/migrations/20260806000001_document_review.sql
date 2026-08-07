-- Document review — the surface Lucas (EAP of record) works on.
--
-- Why this exists: the EAP reviews by opening a Word file, commenting in it and
-- emailing it back — and loses attachments in the process ("I am checking my
-- emails and cant find the AEL application you said I must review", 27 Jul 2026).
-- This gives him one place that says what is waiting for him, lets him comment
-- per section in the browser OR keep his Word round-trip, and records his
-- adoption of a report as an EAP with a timestamp.
--
-- Design notes:
--   * A review is pinned to a document VERSION. If the repo copy moves on, his
--     comments still point at what he actually read. Reviews are frozen artifacts.
--   * Comments anchor to a section KEY (a heading slug), not a character range.
--     Older reviewers should not have to drag-select text precisely.
--   * Batches exist so publishing 16 specialist studies sends ONE email, not 16.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.review_status as enum (
  'pending',
  'changes_requested',
  'approved'
);

-- ---------------------------------------------------------------------------
-- review_batches — one publish event, one notification
-- ---------------------------------------------------------------------------
create table public.review_batches (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  note text,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index review_batches_reviewer_idx
  on public.review_batches (reviewer_id, created_at desc);

-- ---------------------------------------------------------------------------
-- document_reviews — one row per (document version, reviewer)
-- ---------------------------------------------------------------------------
create table public.document_reviews (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  document_version integer not null,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  batch_id uuid references public.review_batches (id) on delete set null,
  status public.review_status not null default 'pending',
  decision_note text,
  -- The reviewer's own commented-in-Word copy, when they use the round-trip.
  annotated_storage_path text,
  annotated_at timestamptz,
  assigned_by uuid references public.profiles (id) on delete set null,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_reviews_unique_per_version
    unique (document_id, document_version, reviewer_id)
);

create index document_reviews_reviewer_status_idx
  on public.document_reviews (reviewer_id, status, assigned_at desc);
create index document_reviews_document_idx
  on public.document_reviews (document_id);
create index document_reviews_batch_idx
  on public.document_reviews (batch_id);

-- ---------------------------------------------------------------------------
-- document_comments — anchored to a section, not a character offset
-- ---------------------------------------------------------------------------
create table public.document_comments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  review_id uuid references public.document_reviews (id) on delete set null,
  author_id uuid references public.profiles (id) on delete set null,
  -- null section_key = a comment on the document as a whole
  section_key text,
  section_title text,
  body text not null,
  resolved boolean not null default false,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index document_comments_document_idx
  on public.document_comments (document_id, created_at);
create index document_comments_review_idx
  on public.document_comments (review_id);
create index document_comments_open_idx
  on public.document_comments (document_id) where not resolved;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create trigger set_updated_at before update on public.review_batches
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.document_reviews
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.document_comments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- completed_at bookkeeping — set when a reviewer reaches a decision, cleared if
-- the review is reopened.
-- ---------------------------------------------------------------------------
create or replace function public.document_review_stamp_completion()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'pending' then
    new.completed_at := null;
  elsif new.status is distinct from old.status then
    new.completed_at := now();
  end if;
  return new;
end;
$$;

create trigger document_reviews_stamp_completion
  before update on public.document_reviews
  for each row execute function public.document_review_stamp_completion();

-- ---------------------------------------------------------------------------
-- RLS — internal-only surface. Clients never see review traffic; the portal_*
-- views are their only read path and are untouched by this migration.
-- ---------------------------------------------------------------------------
alter table public.review_batches enable row level security;
alter table public.document_reviews enable row level security;
alter table public.document_comments enable row level security;

-- review_batches ------------------------------------------------------------
create policy "review_batches_select_internal" on public.review_batches
  for select to authenticated
  using (public.is_internal());

create policy "review_batches_insert_internal" on public.review_batches
  for insert to authenticated
  with check (public.is_internal() and created_by = (select auth.uid()));

create policy "review_batches_update_internal" on public.review_batches
  for update to authenticated
  using (public.is_internal()) with check (public.is_internal());

create policy "review_batches_delete_admin" on public.review_batches
  for delete to authenticated
  using (public.is_admin());

-- document_reviews ----------------------------------------------------------
create policy "document_reviews_select_internal" on public.document_reviews
  for select to authenticated
  using (public.is_internal());

create policy "document_reviews_insert_editors" on public.document_reviews
  for insert to authenticated
  with check (
    public.is_internal()
    and exists (
      select 1 from public.documents d
      where d.id = document_id and public.can_edit_project(d.project_id)
    )
  );

-- The reviewer decides on their own review; anyone who can edit the project may
-- reassign or reopen it.
create policy "document_reviews_update_reviewer_or_editor" on public.document_reviews
  for update to authenticated
  using (
    public.is_internal()
    and (
      reviewer_id = (select auth.uid())
      or exists (
        select 1 from public.documents d
        where d.id = document_id and public.can_edit_project(d.project_id)
      )
    )
  )
  with check (
    public.is_internal()
    and (
      reviewer_id = (select auth.uid())
      or exists (
        select 1 from public.documents d
        where d.id = document_id and public.can_edit_project(d.project_id)
      )
    )
  );

create policy "document_reviews_delete_editors" on public.document_reviews
  for delete to authenticated
  using (
    public.is_internal()
    and exists (
      select 1 from public.documents d
      where d.id = document_id and public.can_edit_project(d.project_id)
    )
  );

-- document_comments ---------------------------------------------------------
create policy "document_comments_select_internal" on public.document_comments
  for select to authenticated
  using (public.is_internal());

create policy "document_comments_insert_internal" on public.document_comments
  for insert to authenticated
  with check (public.is_internal() and author_id = (select auth.uid()));

-- Any internal user may update a comment row, because resolving someone else's
-- comment is a normal workflow act (you fix the point they raised, you tick it
-- off). Editing another person's WORDS is prevented in the app, not here — RLS
-- cannot tell "resolved = true" from "body = something else" in one policy, and
-- a per-column trigger would be heavier than this risk warrants among four
-- colleagues who all already have write access to the underlying documents.
create policy "document_comments_update_internal" on public.document_comments
  for update to authenticated
  using (public.is_internal())
  with check (public.is_internal());

create policy "document_comments_delete_own_or_admin" on public.document_comments
  for delete to authenticated
  using (public.is_admin() or (public.is_internal() and author_id = (select auth.uid())));
