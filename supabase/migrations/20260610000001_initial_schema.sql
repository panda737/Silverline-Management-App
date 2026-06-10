-- ============================================================================
-- Silverline Management Portal — initial schema
-- Tables, enums, triggers, RLS policies, client-portal views, template data.
--
-- Access model:
--   * Base tables are readable/writable by internal users (admin/staff) only,
--     enforced by RLS. Client users get ZERO rows from base tables.
--   * Client users read through the portal_* views (security definer views
--     owned by postgres) which expose only client-safe columns and only rows
--     belonging to the logged-in user's company. This prevents internal-only
--     COLUMNS (projects.description, internal_notes, ...) from ever being
--     selectable by clients — row-level policies alone cannot hide columns.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'staff', 'client');

create type public.project_type as enum (
  'waste_management_licence', 'norms_and_standards', 'audit',
  'compliance_assessment', 'public_participation', 'other'
);

create type public.project_status as enum (
  'not_started', 'in_progress', 'waiting_on_client', 'waiting_on_authority',
  'drafting', 'submitted', 'approved', 'completed', 'on_hold', 'at_risk', 'cancelled'
);

create type public.priority as enum ('low', 'medium', 'high', 'urgent');

create type public.doc_type as enum (
  'application', 'audit_report', 'draft_report', 'final_report', 'ppp_document',
  'authority_correspondence', 'client_information', 'licence_approval',
  'supporting_document', 'other'
);

create type public.timeline_status as enum ('pending', 'in_progress', 'completed', 'skipped');

create type public.task_status as enum ('todo', 'in_progress', 'waiting', 'review', 'done');

create type public.comment_visibility as enum ('internal', 'client');

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- profiles ←→ clients are mutually referencing; create profiles first and add
-- the client FK after clients exists.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  role public.user_role not null default 'client',
  client_id uuid,
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_client_role_has_company check (role <> 'client' or client_id is not null)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  industry text,
  address text,
  notes text, -- internal only; never exposed to portal users
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_client_id_fkey
  foreign key (client_id) references public.clients (id) on delete set null;

create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role_title text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_id uuid not null references public.clients (id) on delete restrict,
  project_type public.project_type not null,
  status public.project_status not null default 'not_started',
  priority public.priority not null default 'medium',
  manager_id uuid references public.profiles (id) on delete set null,
  start_date date,
  target_date date,
  completed_date date,
  description text,      -- internal only
  client_summary text,   -- client-visible
  -- Computed from timeline items by trigger; never hand-entered.
  progress integer not null default 0 check (progress between 0 and 100),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role_on_project text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, profile_id)
);

create table public.timeline_templates (
  id uuid primary key default gen_random_uuid(),
  project_type public.project_type not null,
  stage_name text not null,
  description text,
  sort_order integer not null,
  default_client_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_timeline_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  stage_name text not null,
  status public.timeline_status not null default 'pending',
  description text,
  due_date date,
  completed_date date,
  assigned_to uuid references public.profiles (id) on delete set null,
  client_visible boolean not null default false,
  client_update_text text, -- client-facing wording, separate from internal notes
  internal_notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references public.profiles (id) on delete set null,
  priority public.priority not null default 'medium',
  status public.task_status not null default 'todo',
  due_date date,
  completed_date date,
  created_by uuid references public.profiles (id) on delete set null,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  doc_type public.doc_type not null default 'other',
  storage_path text not null unique,
  version integer not null default 1,
  status text not null default 'current',
  client_visible boolean not null default false,
  uploaded_by uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null,
  visibility public.comment_visibility not null default 'internal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index idx_profiles_client on public.profiles (client_id);
create index idx_clients_created_by on public.clients (created_by);
create index idx_client_contacts_client on public.client_contacts (client_id);
create index idx_projects_client on public.projects (client_id);
create index idx_projects_manager on public.projects (manager_id);
create index idx_projects_status on public.projects (status);
create index idx_projects_type on public.projects (project_type);
create index idx_project_members_project on public.project_members (project_id);
create index idx_project_members_profile on public.project_members (profile_id);
create index idx_timeline_templates_type on public.timeline_templates (project_type, sort_order);
create index idx_timeline_items_project on public.project_timeline_items (project_id, sort_order);
create index idx_timeline_items_assignee on public.project_timeline_items (assigned_to);
create index idx_timeline_items_due on public.project_timeline_items (due_date);
create index idx_tasks_project on public.tasks (project_id);
create index idx_tasks_assignee on public.tasks (assigned_to);
create index idx_tasks_status on public.tasks (status);
create index idx_tasks_due on public.tasks (due_date);
create index idx_task_comments_task on public.task_comments (task_id);
create index idx_documents_project on public.documents (project_id);
create index idx_project_comments_project on public.project_comments (project_id);
create index idx_project_comments_visibility on public.project_comments (visibility);
create index idx_activity_log_project on public.activity_log (project_id, created_at desc);
create index idx_notifications_recipient on public.notifications (recipient_id, read_at);

-- ----------------------------------------------------------------------------
-- Helper functions (used by RLS policies and views)
-- ----------------------------------------------------------------------------

create or replace function public.is_service_role()
returns boolean
language sql stable
as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role',
    false
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active
  );
$$;

create or replace function public.is_internal()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'staff') and active
  );
$$;

-- Returns the company id of the logged-in CLIENT user (null for internal users).
create or replace function public.my_client_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select client_id from public.profiles
  where id = auth.uid() and role = 'client' and active;
$$;

-- Staff may edit a project they manage, created, or are a member of; admins always.
create or replace function public.can_edit_project(pid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_admin() or (
    public.is_internal() and exists (
      select 1 from public.projects p
      where p.id = pid and (
        p.manager_id = auth.uid()
        or p.created_by = auth.uid()
        or exists (
          select 1 from public.project_members m
          where m.project_id = pid and m.profile_id = auth.uid()
        )
      )
    )
  );
$$;

create or replace function public.is_project_manager(pid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = pid and p.manager_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- Triggers
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.client_contacts
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.project_members
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.timeline_templates
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.project_timeline_items
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.task_comments
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.documents
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.project_comments
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.activity_log
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.notifications
  for each row execute function public.set_updated_at();

-- Auto-create a profile when an auth user is created (invite flow).
-- Role/company come from metadata set by the admin invite server action.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role public.user_role;
  v_client_id uuid;
begin
  v_role := coalesce(
    nullif(new.raw_app_meta_data ->> 'user_role', '')::public.user_role,
    nullif(new.raw_user_meta_data ->> 'user_role', '')::public.user_role,
    'client'
  );
  v_client_id := coalesce(
    nullif(new.raw_app_meta_data ->> 'client_id', '')::uuid,
    nullif(new.raw_user_meta_data ->> 'client_id', '')::uuid
  );

  insert into public.profiles (id, email, full_name, role, client_id)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    v_role,
    v_client_id
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync if the auth email changes.
create or replace function public.sync_user_email()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_user_email();

-- Block non-admins from changing role / company / active on profiles
-- (RLS allows users to update their own row; this guards the sensitive fields).
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if public.is_service_role() or auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.client_id is distinct from old.client_id
     or new.active is distinct from old.active then
    raise exception 'Only an admin can change role, company, or active status';
  end if;
  return new;
end;
$$;

create trigger protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Recompute projects.progress whenever timeline items change.
-- progress = completed / (total - skipped), as a 0–100 integer.
create or replace function public.apply_project_progress(pid uuid)
returns void
language sql security definer set search_path = public
as $$
  update public.projects p
  set progress = coalesce((
    select round(
      100.0 * count(*) filter (where t.status = 'completed')
      / nullif(count(*) filter (where t.status <> 'skipped'), 0)
    )
    from public.project_timeline_items t
    where t.project_id = pid
  ), 0)::int
  where p.id = pid;
$$;

create or replace function public.recalc_project_progress()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.apply_project_progress(new.project_id);
  end if;
  if tg_op = 'DELETE' then
    perform public.apply_project_progress(old.project_id);
  elsif tg_op = 'UPDATE' and old.project_id is distinct from new.project_id then
    perform public.apply_project_progress(old.project_id);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger recalc_project_progress
  after insert or update or delete on public.project_timeline_items
  for each row execute function public.recalc_project_progress();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.client_contacts enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.timeline_templates enable row level security;
alter table public.project_timeline_items enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.documents enable row level security;
alter table public.project_comments enable row level security;
alter table public.activity_log enable row level security;
alter table public.notifications enable row level security;

-- profiles -------------------------------------------------------------------
-- Everyone sees their own profile; internal users see all profiles;
-- clients additionally see the profile of managers of their company's projects
-- (so the portal can show the project manager's name).
create policy "profiles_select" on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or public.is_internal()
  or exists (
    select 1 from public.projects p
    where p.manager_id = profiles.id
      and p.client_id = public.my_client_id()
  )
);

create policy "profiles_update_own" on public.profiles for update to authenticated
using (id = (select auth.uid()) or public.is_admin())
with check (id = (select auth.uid()) or public.is_admin());

create policy "profiles_delete_admin" on public.profiles for delete to authenticated
using (public.is_admin());

-- clients --------------------------------------------------------------------
-- Internal read; admin write. Portal users get company info via portal_company view.
create policy "clients_select_internal" on public.clients for select to authenticated
using (public.is_internal());

create policy "clients_insert_admin" on public.clients for insert to authenticated
with check (public.is_admin());

create policy "clients_update_admin" on public.clients for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "clients_delete_admin" on public.clients for delete to authenticated
using (public.is_admin());

-- client_contacts ------------------------------------------------------------
create policy "client_contacts_select_internal" on public.client_contacts for select to authenticated
using (public.is_internal());

create policy "client_contacts_insert_admin" on public.client_contacts for insert to authenticated
with check (public.is_admin());

create policy "client_contacts_update_admin" on public.client_contacts for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "client_contacts_delete_admin" on public.client_contacts for delete to authenticated
using (public.is_admin());

-- projects -------------------------------------------------------------------
-- Internal read all; staff write where managing/member; admin write all.
-- Clients read via portal_projects view only (column-safe).
create policy "projects_select_internal" on public.projects for select to authenticated
using (public.is_internal());

create policy "projects_insert_internal" on public.projects for insert to authenticated
with check (public.is_internal());

create policy "projects_update_editors" on public.projects for update to authenticated
using (public.can_edit_project(id)) with check (public.can_edit_project(id));

create policy "projects_delete_admin" on public.projects for delete to authenticated
using (public.is_admin());

-- project_members ------------------------------------------------------------
create policy "project_members_select_internal" on public.project_members for select to authenticated
using (public.is_internal());

create policy "project_members_insert_managers" on public.project_members for insert to authenticated
with check (public.is_admin() or (public.is_internal() and public.is_project_manager(project_id)));

create policy "project_members_update_managers" on public.project_members for update to authenticated
using (public.is_admin() or (public.is_internal() and public.is_project_manager(project_id)))
with check (public.is_admin() or (public.is_internal() and public.is_project_manager(project_id)));

create policy "project_members_delete_managers" on public.project_members for delete to authenticated
using (public.is_admin() or (public.is_internal() and public.is_project_manager(project_id)));

-- timeline_templates ----------------------------------------------------------
create policy "timeline_templates_select_internal" on public.timeline_templates for select to authenticated
using (public.is_internal());

create policy "timeline_templates_insert_admin" on public.timeline_templates for insert to authenticated
with check (public.is_admin());

create policy "timeline_templates_update_admin" on public.timeline_templates for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "timeline_templates_delete_admin" on public.timeline_templates for delete to authenticated
using (public.is_admin());

-- project_timeline_items ------------------------------------------------------
create policy "timeline_items_select_internal" on public.project_timeline_items for select to authenticated
using (public.is_internal());

create policy "timeline_items_insert_editors" on public.project_timeline_items for insert to authenticated
with check (public.can_edit_project(project_id));

create policy "timeline_items_update_editors" on public.project_timeline_items for update to authenticated
using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

create policy "timeline_items_delete_editors" on public.project_timeline_items for delete to authenticated
using (public.can_edit_project(project_id));

-- tasks ------------------------------------------------------------------------
create policy "tasks_select_internal" on public.tasks for select to authenticated
using (public.is_internal());

create policy "tasks_insert_internal" on public.tasks for insert to authenticated
with check (public.is_internal());

create policy "tasks_update_involved" on public.tasks for update to authenticated
using (
  public.can_edit_project(project_id)
  or (public.is_internal() and (assigned_to = (select auth.uid()) or created_by = (select auth.uid())))
)
with check (
  public.can_edit_project(project_id)
  or (public.is_internal() and (assigned_to = (select auth.uid()) or created_by = (select auth.uid())))
);

create policy "tasks_delete_editors" on public.tasks for delete to authenticated
using (public.is_admin() or public.can_edit_project(project_id) or (public.is_internal() and created_by = (select auth.uid())));

-- task_comments -----------------------------------------------------------------
create policy "task_comments_select_internal" on public.task_comments for select to authenticated
using (public.is_internal());

create policy "task_comments_insert_internal" on public.task_comments for insert to authenticated
with check (public.is_internal() and author_id = (select auth.uid()));

create policy "task_comments_update_own" on public.task_comments for update to authenticated
using (public.is_admin() or (public.is_internal() and author_id = (select auth.uid())))
with check (public.is_admin() or (public.is_internal() and author_id = (select auth.uid())));

create policy "task_comments_delete_own" on public.task_comments for delete to authenticated
using (public.is_admin() or (public.is_internal() and author_id = (select auth.uid())));

-- documents ----------------------------------------------------------------------
create policy "documents_select_internal" on public.documents for select to authenticated
using (public.is_internal());

create policy "documents_insert_editors" on public.documents for insert to authenticated
with check (public.can_edit_project(project_id));

create policy "documents_update_editors" on public.documents for update to authenticated
using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

create policy "documents_delete_editors" on public.documents for delete to authenticated
using (public.can_edit_project(project_id));

-- project_comments -----------------------------------------------------------------
create policy "project_comments_select_internal" on public.project_comments for select to authenticated
using (public.is_internal());

create policy "project_comments_insert_internal" on public.project_comments for insert to authenticated
with check (public.is_internal() and author_id = (select auth.uid()));

create policy "project_comments_update_own" on public.project_comments for update to authenticated
using (public.is_admin() or (public.is_internal() and author_id = (select auth.uid())))
with check (public.is_admin() or (public.is_internal() and author_id = (select auth.uid())));

create policy "project_comments_delete_own" on public.project_comments for delete to authenticated
using (public.is_admin() or (public.is_internal() and author_id = (select auth.uid())));

-- activity_log -----------------------------------------------------------------------
create policy "activity_log_select_internal" on public.activity_log for select to authenticated
using (public.is_internal());

create policy "activity_log_insert_internal" on public.activity_log for insert to authenticated
with check (public.is_internal() and actor_id = (select auth.uid()));

create policy "activity_log_delete_admin" on public.activity_log for delete to authenticated
using (public.is_admin());

-- notifications ------------------------------------------------------------------------
create policy "notifications_select_own" on public.notifications for select to authenticated
using (recipient_id = (select auth.uid()));

create policy "notifications_insert_internal" on public.notifications for insert to authenticated
with check (public.is_internal());

create policy "notifications_update_own" on public.notifications for update to authenticated
using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));

create policy "notifications_delete_own" on public.notifications for delete to authenticated
using (recipient_id = (select auth.uid()) or public.is_admin());

-- ----------------------------------------------------------------------------
-- Client portal views (security definer: owned by postgres, bypass base RLS,
-- and filter by the logged-in client user's company inside the view itself).
-- These expose ONLY client-safe columns.
-- ----------------------------------------------------------------------------

create view public.portal_company
with (security_barrier = true)
as
select c.id, c.company_name, c.industry
from public.clients c
where c.id = public.my_client_id();

create view public.portal_projects
with (security_barrier = true)
as
select
  p.id, p.name, p.project_type, p.status, p.priority,
  p.start_date, p.target_date, p.completed_date,
  p.client_summary, p.progress, p.created_at, p.updated_at,
  mgr.full_name as manager_name
from public.projects p
left join public.profiles mgr on mgr.id = p.manager_id
where p.client_id = public.my_client_id();

create view public.portal_timeline_items
with (security_barrier = true)
as
select
  t.id, t.project_id, t.stage_name, t.status, t.description,
  t.due_date, t.completed_date, t.client_update_text, t.sort_order
from public.project_timeline_items t
join public.projects p on p.id = t.project_id
where t.client_visible = true
  and p.client_id = public.my_client_id();

create view public.portal_documents
with (security_barrier = true)
as
select
  d.id, d.project_id, d.name, d.doc_type, d.version, d.status,
  d.storage_path, d.created_at
from public.documents d
join public.projects p on p.id = d.project_id
where d.client_visible = true
  and p.client_id = public.my_client_id();

create view public.portal_updates
with (security_barrier = true)
as
select
  pc.id, pc.project_id, pc.body, pc.created_at,
  author.full_name as author_name,
  p.name as project_name
from public.project_comments pc
join public.projects p on p.id = pc.project_id
left join public.profiles author on author.id = pc.author_id
where pc.visibility = 'client'
  and p.client_id = public.my_client_id();

revoke all on public.portal_company, public.portal_projects, public.portal_timeline_items,
  public.portal_documents, public.portal_updates from anon;
grant select on public.portal_company, public.portal_projects, public.portal_timeline_items,
  public.portal_documents, public.portal_updates to authenticated;

-- ----------------------------------------------------------------------------
-- Timeline templates (reference data — templates are data, not code)
-- ----------------------------------------------------------------------------
insert into public.timeline_templates (project_type, stage_name, description, sort_order, default_client_visible) values
-- Waste Management Licence
('waste_management_licence', 'Initial client consultation', 'Kick-off meeting to understand the facility, activities and licensing requirements.', 1, true),
('waste_management_licence', 'Site information received', 'All required site and operational information received from the client.', 2, true),
('waste_management_licence', 'Application scope confirmed', 'Scope of the waste management licence application agreed and confirmed.', 3, true),
('waste_management_licence', 'Draft application started', 'Drafting of the licence application documentation underway.', 4, true),
('waste_management_licence', 'Specialist studies', 'Specialist studies commissioned and completed where required.', 5, true),
('waste_management_licence', 'Public Participation Process started', 'Public participation process initiated with interested and affected parties.', 6, true),
('waste_management_licence', 'PPP completed', 'Public participation process concluded; comments and responses compiled.', 7, true),
('waste_management_licence', 'Draft report completed', 'Draft application report completed for review.', 8, true),
('waste_management_licence', 'Final report submitted', 'Final application submitted to the competent authority.', 9, true),
('waste_management_licence', 'Authority review', 'Application under review by the authority; responding to queries as needed.', 10, true),
('waste_management_licence', 'Licence issued', 'Waste management licence issued by the authority.', 11, true),
('waste_management_licence', 'Project completed', 'Project closed out and all deliverables handed over.', 12, true),
-- Norms & Standards
('norms_and_standards', 'Client information received', 'All required information received from the client.', 1, true),
('norms_and_standards', 'Site assessment', 'Site assessed against the applicable norms and standards.', 2, true),
('norms_and_standards', 'Registration documentation drafted', 'Registration documentation prepared.', 3, true),
('norms_and_standards', 'Internal review', 'Internal quality review of the registration documentation.', 4, false),
('norms_and_standards', 'Submitted to authority', 'Registration submitted to the competent authority.', 5, true),
('norms_and_standards', 'Authority feedback received', 'Feedback received from the authority and addressed.', 6, true),
('norms_and_standards', 'Registration completed', 'Registration finalised and confirmed.', 7, true),
-- Audit
('audit', 'Audit scheduled', 'Audit date confirmed with the client.', 1, true),
('audit', 'Site inspection completed', 'On-site inspection completed.', 2, true),
('audit', 'Findings drafted', 'Audit findings drafted.', 3, true),
('audit', 'Internal review', 'Internal quality review of the audit findings.', 4, false),
('audit', 'Draft report sent to client', 'Draft audit report issued to the client for comment.', 5, true),
('audit', 'Client comments received', 'Client comments on the draft report received.', 6, true),
('audit', 'Final report issued', 'Final audit report issued.', 7, true),
('audit', 'Corrective actions tracked', 'Corrective actions tracked to close-out.', 8, true),
-- Compliance Assessment
('compliance_assessment', 'Project initiated', 'Scope confirmed and project initiated.', 1, true),
('compliance_assessment', 'Site / information assessment', 'Site and documentation assessed against applicable requirements.', 2, true),
('compliance_assessment', 'Draft findings prepared', 'Draft compliance findings prepared.', 3, true),
('compliance_assessment', 'Internal review', 'Internal quality review of the assessment.', 4, false),
('compliance_assessment', 'Final report delivered', 'Final compliance assessment report delivered to the client.', 5, true),
-- Public Participation
('public_participation', 'Project initiated', 'Scope confirmed and project initiated.', 1, true),
('public_participation', 'Stakeholder identification', 'Interested and affected parties identified and notified.', 2, true),
('public_participation', 'Public participation underway', 'Comment period open; meetings and notices in progress.', 3, true),
('public_participation', 'Comments & responses compiled', 'Comments and responses report compiled.', 4, true),
('public_participation', 'Final PPP report delivered', 'Final public participation report delivered.', 5, true),
-- Other
('other', 'Project initiated', 'Scope confirmed and project initiated.', 1, true),
('other', 'Information gathering', 'Required information collected.', 2, true),
('other', 'Work in progress', 'Core project work underway.', 3, true),
('other', 'Internal review', 'Internal quality review of deliverables.', 4, false),
('other', 'Project completed', 'Deliverables handed over and project closed.', 5, true);
