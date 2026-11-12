# law-crm

A law-firm CRM: a **Hono + Prisma API** (`backend/`, port 3000) and a **Next.js frontend**
(`frontend/`, port 3001), both on a **Supabase** project (Postgres + Auth).

## 1. Prerequisites

| Tool | Why | Check |
|---|---|---|
| [Bun](https://bun.sh) 1.4+ | runs the backend and installs packages | `bun --version` |
| Node.js 20+ | used by Next.js and the Prisma CLI | `node --version` |
| `psql` (PostgreSQL client) | runs the database migrations | `psql --version` |
| A Supabase project | database + logins (free tier is fine) | https://supabase.com/dashboard |

## 2. Get the code and install

```bash
git clone https://github.com/kazkianoush/law-crm.git
cd law-crm
(cd backend  && bun install)
(cd frontend && bun install)
```

## 3. Supabase project

1. Create a project at https://supabase.com/dashboard and remember the **database password** you set.
2. Collect these (each is explained in the `.env.example` files):
   - **Project Settings -> API:** Project URL, the **anon** key, and the **service_role / secret** key.
   - **Connect:** the **pooled** connection string and the **direct** connection string. Put your database password into both.
3. **Authentication -> Providers:** make sure **Email** is enabled.
   If "Confirm email" is on, new sign-ups must click a link before they can log in.
   Accounts made by the scripts in this repo are already confirmed.

## 4. Environment files (not in git: you must create them)

```bash
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env.local
```

Fill them in as the comments describe.

| File | Variable | Required | Meaning |
|---|---|---|---|
| `backend/.env` | `SUPABASE_URL` | yes | Supabase project URL |
| | `SUPABASE_SECRET_KEY` | yes | server-side key, **never expose it** |
| | `DATABASE_URL` | yes | pooled Postgres URL, used by the API (Prisma) |
| | `DIRECT_URL` | yes | direct Postgres URL, used by migrations and `prisma db pull` |
| | `FRONTEND_ORIGIN` | no | CORS origin, default `http://localhost:3001` |
| | `SEED_PASSWORD` | no | password for dev accounts the scripts create |
| `frontend/.env.local` | `NEXT_PUBLIC_SUPABASE_URL` | yes | same project URL |
| | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | public anon key |
| | `NEXT_PUBLIC_API_URL` | no | backend URL, default `http://localhost:3000` |

`.env` and `.env.local` are git-ignored. Only the `.env.example` files are committed.

## 5. Create the database tables

Schema changes are numbered SQL files in `backend/db/` (`000_base_tables.sql`, `001_teams.sql`, ...).
**Do not use `prisma db push`**, which can drop tables it doesn't know about.

```bash
cd backend
set -a; source .env; set +a      # loads DIRECT_URL into your shell
./db/apply.sh                    # runs every file not yet applied, in order
```

`apply.sh` records what it ran in a `_migrations` table, so it is safe to re-run.
Re-run it whenever you pull new files from `db/`.

Then generate the Prisma client:

```bash
npx prisma generate
```

## 6. Run it

Two terminals:

```bash
# terminal 1: API on http://localhost:3000
cd backend && bun run dev

# terminal 2: frontend on http://localhost:3001
cd frontend && bun run dev
```

Open http://localhost:3001 and sign up or log in.

## 7. Try it with sample data (dev only)

Run these from `backend/` with the API's `.env` in place. They write to your real Supabase project and use
a shared dev password (`SEED_PASSWORD`, or the default in the script).

```bash
# a user that belongs to no organization
bun run scripts/create-user.ts someone@acme-seed.test "Some One"

# an organization with that user as its owner
bun run scripts/create-org.ts someone@acme-seed.test "Acme Law"

# four sample members added to "Acme Law"
bun run scripts/seed-members.ts
```

Never run these against a project that holds real client data.

## 8. Project layout

```
backend/
  src/index.ts          app setup: CORS, login check, mounts the route files
  src/routes/           tasks.ts, orgs.ts, users.ts, demo.ts
  src/middleware/auth.ts verifies the Supabase token, sets userId / role
  prisma/schema.prisma  hand-maintained models (see "Prisma notes")
  db/                   numbered SQL migrations + apply.sh
  scripts/              dev helper scripts (create-user, create-org, seed-members)
frontend/
  app/login             login / sign-up
  app/orgs              organization list, then /orgs/[orgId] (members, roles, invite)
  app/tasks, addtasks   task pages
  app/lib               API helper (apiFetch), Supabase client, data hooks
  app/components        shared UI
```

## 9. Notes and gotchas

- **New top-level API paths must be added to the login-protected list** in `backend/src/index.ts`
  (`/tasks`, `/users`, `/orgs`, ...). A path that isn't listed there is open to anyone.
- **Prisma notes:** `schema.prisma` came from `prisma db pull` with `auth` as a second schema, so it also
  contains Supabase's internal auth tables. After changing the database, re-run `npx prisma db pull` then
  `npx prisma generate`, and restart your editor's TypeScript server.
- **`prisma db pull` fails with P4002** if the datasource doesn't list both `public` and `auth`
  (they are listed in `schema.prisma`).
- **Wrong port in CORS errors:** the browser must be on the address in `FRONTEND_ORIGIN`
  (default `http://localhost:3001`).
- **401 everywhere:** the frontend and backend must use the same Supabase project, and the backend needs
  `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
- **`apply.sh` says `DIRECT_URL` is not set:** run `set -a; source .env; set +a` first.
- **Global admin:** a user whose Supabase `app_metadata.role` is `admin` sees everything in the old task
  routes. Set it in the Supabase dashboard (Authentication -> Users -> the user -> app metadata). This
  global role is planned to be removed in favor of per-organization roles.
- **Roles per organization:** `owner`, `admin`, `member`. Owners can change roles, owners and admins can add members.
