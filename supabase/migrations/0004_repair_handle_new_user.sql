-- ============================================================================
-- Orbital Balance — Repair: signup 500 "Database error saving new user" (0004)
--
-- Root cause (confirmed in postgres_logs):
--   null value in column "full_name" of relation "profiles" violates not-null
--   constraint
--
-- The live profiles table has full_name NOT NULL (no default), but
-- handle_new_user() inserted only (id, email, name). Every signup aborted in
-- the on_auth_user_created trigger -> GoTrue returned HTTP 500.
--
-- Fix: populate full_name (and keep name/email for app compatibility), and make
-- the category seed non-fatal so signup can never 500 on it.
-- Idempotent.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1)
  );
begin
  insert into public.profiles (id, email, name, full_name)
  values (new.id, new.email, v_name, v_name)
  on conflict (id) do nothing;

  begin
    perform public.seed_default_categories(new.id);
  exception when others then
    raise warning 'handle_new_user: seed_default_categories failed for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
