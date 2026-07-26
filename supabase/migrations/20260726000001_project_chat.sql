-- ============================================================================
-- Project Chat — a conversational surface over the portal's own data.
--
-- Shape:
--   chat_threads    one conversation. Optionally pinned to a project, in which
--                   case the assistant is told to stay inside that engagement.
--   chat_messages   the turns, in order, including the tool trace so a reader
--                   can see which records an answer was actually built from.
--
-- The `chat` edge function is the only writer of assistant rows. Critically, it
-- queries project data through a client built from the CALLER'S OWN JWT, not the
-- service role — so RLS scopes what the assistant can read to exactly what the
-- person asking could already open in the UI. There is no separate permission
-- model to keep in sync, and no way for the chat to become a way around RLS.
--
-- Visibility: INTERNAL ONLY, and additionally private to the thread's owner.
-- Two staff members do not read each other's conversations. That is deliberate
-- rather than incidental: a thread is a scratchpad where someone thinks out
-- loud about a client's file, and it accumulates half-formed conclusions that
-- should not read as the firm's position. Sharing, if it is ever wanted, should
-- be an explicit act on a specific thread, not the default.
-- ============================================================================

create type public.chat_message_role as enum ('user', 'assistant');

-- ----------------------------------------------------------------------------
-- Threads
-- ----------------------------------------------------------------------------
create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  -- null = a portfolio-wide conversation ("what should we focus on this week?").
  -- Set = pinned to one engagement; the function narrows the assistant's scope
  -- and its tool results to that project.
  project_id uuid references public.projects (id) on delete cascade,

  -- Generated from the first user message rather than asked for, so starting a
  -- conversation costs one keystroke. Editable.
  title text not null default 'New conversation',

  -- Denormalised so the thread list sorts without touching chat_messages.
  last_message_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_chat_threads_owner
  on public.chat_threads (owner_id, last_message_at desc);
create index idx_chat_threads_project
  on public.chat_threads (project_id, last_message_at desc)
  where project_id is not null;

-- ----------------------------------------------------------------------------
-- Messages
-- ----------------------------------------------------------------------------
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads (id) on delete cascade,

  role public.chat_message_role not null,
  content text not null default '',

  -- Which tools ran for this turn and what they were asked, e.g.
  --   [{"name":"get_project","input":{"project_id":"…"},"summary":"Dilex Inland"}]
  -- Kept so an answer can be audited back to the records behind it. Inputs and
  -- short summaries only — never full tool output, which can be large and is
  -- reproducible from the records themselves.
  tool_calls jsonb not null default '[]'::jsonb,

  -- Set when a turn fails mid-stream, so the UI can show what went wrong
  -- instead of leaving a truncated assistant bubble.
  error_message text,

  model text,
  input_tokens integer,
  output_tokens integer,
  -- Cached prompt tokens read on this turn. The system prompt and tool schemas
  -- are a stable prefix, so after the first turn this should dominate
  -- input_tokens; if it stays zero something is invalidating the cache.
  cache_read_tokens integer,

  created_at timestamptz not null default now()
);

create index idx_chat_messages_thread
  on public.chat_messages (thread_id, created_at);

-- ----------------------------------------------------------------------------
-- Keep the thread's sort key current without the app having to remember to.
-- ----------------------------------------------------------------------------
create or replace function public.touch_chat_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_threads
     set last_message_at = new.created_at,
         updated_at = now()
   where id = new.thread_id;
  return new;
end;
$$;

create trigger trg_chat_messages_touch_thread
  after insert on public.chat_messages
  for each row execute function public.touch_chat_thread();

create trigger trg_chat_threads_updated_at before update on public.chat_threads
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS — internal staff, and only your own threads.
--
-- Both halves are required on every policy. is_internal() alone would let any
-- staff member read every colleague's conversation; owner_id alone would let a
-- client account hold a thread, and the function's tools would then run under a
-- client's RLS and quietly return portal data into a surface never designed for
-- it. Requiring both keeps the feature squarely internal.
-- ----------------------------------------------------------------------------
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

create policy "chat_threads_own_select" on public.chat_threads
  for select to authenticated
  using (public.is_internal() and owner_id = auth.uid());

create policy "chat_threads_own_insert" on public.chat_threads
  for insert to authenticated
  with check (public.is_internal() and owner_id = auth.uid());

-- Rename and re-pin your own threads.
create policy "chat_threads_own_update" on public.chat_threads
  for update to authenticated
  using (public.is_internal() and owner_id = auth.uid())
  with check (public.is_internal() and owner_id = auth.uid());

create policy "chat_threads_own_delete" on public.chat_threads
  for delete to authenticated
  using (public.is_internal() and owner_id = auth.uid());

-- Messages inherit their thread's ownership. The subquery is why chat_messages
-- carries no owner_id of its own: one source of truth for who a thread belongs
-- to, so a re-pin or a transfer can never leave rows behind pointing at the
-- previous owner.
create policy "chat_messages_own_select" on public.chat_messages
  for select to authenticated
  using (
    public.is_internal()
    and exists (
      select 1 from public.chat_threads t
       where t.id = chat_messages.thread_id
         and t.owner_id = auth.uid()
    )
  );

-- The user's own turns are written from the browser; assistant turns are written
-- by the edge function under the same JWT, so this one policy covers both. The
-- role column is not constrained here because a user forging an 'assistant' row
-- in their own private thread only misleads themselves.
create policy "chat_messages_own_insert" on public.chat_messages
  for insert to authenticated
  with check (
    public.is_internal()
    and exists (
      select 1 from public.chat_threads t
       where t.id = chat_messages.thread_id
         and t.owner_id = auth.uid()
    )
  );

create policy "chat_messages_own_delete" on public.chat_messages
  for delete to authenticated
  using (
    public.is_internal()
    and exists (
      select 1 from public.chat_threads t
       where t.id = chat_messages.thread_id
         and t.owner_id = auth.uid()
    )
  );
