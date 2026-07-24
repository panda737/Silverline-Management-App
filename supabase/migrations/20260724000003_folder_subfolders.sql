-- ============================================================================
-- Subfolders for project document folders
--
-- A root folder (e.g. "Submissions to Authority") can hold subfolders, one per
-- actual event: "Submission 1 – Licence Application", "Draft Scoping – Aug
-- 2023", "Final Scoping". Everything that went out in that submission — the
-- cover email, the report, the annexures — lives together in that subfolder.
--
-- Depth is capped at two levels on purpose: a subfolder cannot itself have
-- children. Deep trees are where filing systems go to die, and two levels
-- already expresses "category → the specific event".
-- ============================================================================

alter table public.project_folders
  add column if not exists parent_id uuid
    references public.project_folders (id) on delete cascade;

create index if not exists idx_project_folders_parent
  on public.project_folders (parent_id, sort_order);

-- Names must be unique within their parent, not across the whole project —
-- "Correspondence" may exist under two different submissions. NULLS NOT
-- DISTINCT so two root folders still can't share a name (PG15+).
drop index if exists idx_project_folders_unique_name;
create unique index idx_project_folders_unique_name
  on public.project_folders (project_id, parent_id, lower(name))
  nulls not distinct;

-- Enforce the two-level cap: a folder's parent must itself be a root folder.
create or replace function public.enforce_folder_depth()
returns trigger
language plpgsql
as $$
declare
  parent_parent uuid;
  parent_project uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'A folder cannot be its own parent';
  end if;

  select parent_id, project_id into parent_parent, parent_project
  from public.project_folders where id = new.parent_id;

  if parent_project is distinct from new.project_id then
    raise exception 'A subfolder must belong to the same project as its parent';
  end if;

  if parent_parent is not null then
    raise exception 'Folders can only be nested one level deep';
  end if;

  return new;
end;
$$;

create trigger enforce_folder_depth_trigger
  before insert or update on public.project_folders
  for each row execute function public.enforce_folder_depth();
