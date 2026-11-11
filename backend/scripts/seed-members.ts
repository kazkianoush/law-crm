// Creates sample users (real Supabase logins + public.users profiles) and adds
// them to an organization as plain members. Safe to re-run: existing users and
// memberships are skipped, and existing roles are never changed.
//
//   bun run scripts/seed-members.ts                 # org "Acme Law"
//   bun run scripts/seed-members.ts "Smith & Co"    # another org, by name
//
// Run from backend/ (it reads backend/.env). Needs no running server.
// These are DEV accounts that share one password: don't use it against a real firm's data.

import { supabase as admin } from '../src/lib/supabase' // service-key client
import { prisma } from '../src/lib/prisma'

const ORG_NAME = process.argv.slice(2).join(' ').trim() || 'Acme Law'
const PASSWORD = process.env.SEED_PASSWORD ?? 'Passw0rd-seed-1!'

// Edit this list to add or change the sample users.
const USERS = [
  { name: 'Alice Johnson', email: 'alice.johnson@acme-seed.test' },
  { name: 'Bob Smith', email: 'bob.smith@acme-seed.test' },
  { name: 'Carol Diaz', email: 'carol.diaz@acme-seed.test' },
  { name: 'Dev Patel', email: 'dev.patel@acme-seed.test' },
]

try {
  // 1. find the org (by name; refuse if it's missing or ambiguous)
  const orgs = await prisma.orgs.findMany({ where: { name: ORG_NAME } })
  if (orgs.length === 0) {
    console.error(`No org named "${ORG_NAME}". Create it first (scripts/create-org.ts).`)
    process.exit(1)
  }
  if (orgs.length > 1) {
    console.error(`${orgs.length} orgs are named "${ORG_NAME}": ${orgs.map((o) => o.id).join(', ')}`)
    process.exit(1)
  }
  const org = orgs[0]!
  console.log(`Org: "${org.name}" (${org.id})\n`)

  // 2. existing logins, so re-running doesn't fail on "email already registered"
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listError) throw listError
  const idByEmail = new Map(list.users.map((u) => [u.email?.toLowerCase(), u.id]))

  for (const u of USERS) {
    // 3. the login (Supabase auth)
    let id = idByEmail.get(u.email.toLowerCase())
    let created = false
    if (!id) {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: PASSWORD,
        email_confirm: true, // no confirmation email needed
      })
      if (error || !data.user) throw new Error(`createUser ${u.email}: ${error?.message}`)
      id = data.user.id
      created = true
    }

    // 4. the profile row (the API normally creates this at first login)
    await prisma.public_users.upsert({
      where: { id },
      update: {},
      create: { id, name: u.name, email: u.email },
    })

    // 5. the membership; `update: {}` leaves an existing role untouched
    const before = await prisma.org_members.findUnique({
      where: { org_id_user_id: { org_id: org.id, user_id: id } },
    })
    await prisma.org_members.upsert({
      where: { org_id_user_id: { org_id: org.id, user_id: id } },
      update: {},
      create: { org_id: org.id, user_id: id, role: 'member' },
    })

    console.log(
      `${created ? 'created ' : 'existing'}  ${u.email.padEnd(32)} ${before ? `already ${before.role}` : 'added as member'}`
    )
  }

  console.log(`\nDone. Log in as any of them with password: ${PASSWORD}`)
} catch (err) {
  console.error('Failed:', (err as Error).message)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
