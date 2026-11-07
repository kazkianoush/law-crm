-- Rename teams -> orgs, team_members -> org_members.
-- Both tables are empty at this point, so this is a pure rename.

alter table public.teams        rename to orgs;
alter table public.team_members rename to org_members;
alter table public.org_members  rename column team_id to org_id;

-- constraint and index names, so they match the new table names
alter table public.orgs        rename constraint teams_pkey               to orgs_pkey;
alter table public.orgs        rename constraint teams_name_check         to orgs_name_check;
alter table public.orgs        rename constraint teams_created_by_fkey    to orgs_created_by_fkey;

alter table public.org_members rename constraint team_members_pkey         to org_members_pkey;
alter table public.org_members rename constraint team_members_role_check   to org_members_role_check;
alter table public.org_members rename constraint team_members_team_id_fkey to org_members_org_id_fkey;
alter table public.org_members rename constraint team_members_user_id_fkey to org_members_user_id_fkey;

alter index public.team_members_user_idx rename to org_members_user_idx;
