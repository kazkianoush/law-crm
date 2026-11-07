-- Make public.users the profile table for logins (public.users.id -> auth.users.id),
-- and point org_members / orgs at public.users instead of auth.users.

-- 1. public.users.id is always the login id, so it no longer needs a random default
alter table public.users alter column id drop default;

-- 2. each profile row must be a real login (no on delete cascade: deleting a login
--    that still owns tasks should fail loudly, not wipe data)
alter table public.users
  add constraint users_id_fkey foreign key (id) references auth.users(id);

-- 3. re-point the org tables at public.users
alter table public.org_members drop constraint org_members_user_id_fkey;
alter table public.org_members
  add constraint org_members_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.orgs drop constraint orgs_created_by_fkey;
alter table public.orgs
  add constraint orgs_created_by_fkey
  foreign key (created_by) references public.users(id);
