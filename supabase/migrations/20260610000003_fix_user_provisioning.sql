-- ============================================================================
-- Fix user provisioning:
--  * GoTrue inserts auth.users before custom metadata is attached in some
--    flows, so the profile trigger cannot rely on metadata at INSERT time.
--    Drop the over-strict check constraint; a client-role profile without a
--    company simply sees nothing (my_client_id() returns null).
--  * Read role/client_id ONLY from raw_app_meta_data (users can freely edit
--    their own user_metadata via auth.updateUser — it must never drive roles).
--  * Sync role/client_id into profiles when app_metadata changes, so
--    admin.createUser / admin.updateUserById stamp the correct role.
-- ============================================================================

alter table public.profiles drop constraint if exists chk_client_role_has_company;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role public.user_role;
  v_client_id uuid;
begin
  -- app_metadata only: it is admin-controlled. user_metadata is user-editable.
  v_role := coalesce(
    nullif(new.raw_app_meta_data ->> 'user_role', '')::public.user_role,
    'client'
  );
  v_client_id := nullif(new.raw_app_meta_data ->> 'client_id', '')::uuid;

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

create or replace function public.sync_user_metadata()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role public.user_role;
  v_client_id uuid;
begin
  v_role := nullif(new.raw_app_meta_data ->> 'user_role', '')::public.user_role;
  v_client_id := nullif(new.raw_app_meta_data ->> 'client_id', '')::uuid;

  update public.profiles
  set
    role = coalesce(v_role, role),
    client_id = coalesce(v_client_id, client_id),
    full_name = case
      when full_name = '' then coalesce(new.raw_user_meta_data ->> 'full_name', '')
      else full_name
    end
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_meta_updated on auth.users;
create trigger on_auth_user_meta_updated
  after update of raw_app_meta_data, raw_user_meta_data on auth.users
  for each row execute function public.sync_user_metadata();
