-- 000_base_tables.sql
-- The tables that existed before the numbered migrations (they were originally made
-- by hand in the Supabase dashboard). A new project needs them before 001 runs.
-- `if not exists` makes this a no-op on a database that already has them.
-- Later migrations change these: 003 drops users.id's default and links it to auth.users.

create table if not exists public.users (
  id     uuid primary key default gen_random_uuid(),
  name   text not null,
  email  text
);

create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  users_id     uuid not null references public.users(id),
  title        text,
  description  text,
  status       text,
  due_date     date
);

-- The API reaches the database with a server-side role that bypasses row-level
-- security. Enabling it with no policies keeps these tables closed to the public
-- (anon) key, which the browser holds.
alter table public.users enable row level security;
alter table public.tasks enable row level security;
