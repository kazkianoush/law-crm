--  teams and team membership

create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

create table public.team_members (
  team_id     uuid not null references public.teams(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('owner','admin','member')),
  created_at  timestamptz not null default now(),
  primary key (team_id, user_id)
);

-- "which teams am I on" is the hottest query
create index team_members_user_idx on public.team_members (user_id);

