// Creates one user (a Supabase login plus the public.users profile row) and
// does NOT add them to any organization. Safe to re-run: an existing login is reused.
//
//   bun run scripts/create-user.ts <email> "<name>"
//   e.g. bun run scripts/create-user.ts no.org@acme-seed.test "No Org"
//
// Run from backend/ (it reads backend/.env). Needs no running server.
// Dev account: uses SEED_PASSWORD if set, otherwise the same default as seed-members.ts.

import { supabase as admin } from '../src/lib/supabase' // service-key client
import { prisma } from '../src/lib/prisma'

const [email, ...nameParts] = process.argv.slice(2)
const name = nameParts.join(' ').trim() || email?.split('@')[0]
const PASSWORD = process.env.SEED_PASSWORD ?? 'Passw0rd-seed-1!'

if (!email || !name) {
  console.error('Usage: bun run scripts/create-user.ts <email> "<name>"')
  process.exit(1)
}

try {
  // reuse an existing login for this email, otherwise create one
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listError) throw listError
  let id = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id
  let created = false

  if (!id) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true, // no confirmation email needed
    })
    if (error || !data.user) throw new Error(`createUser: ${error?.message}`)
    id = data.user.id
    created = true
  }

  // the profile row (the API normally creates this at first login)
  await prisma.public_users.upsert({
    where: { id },
    update: {},
    create: { id, name, email },
  })

  const memberships = await prisma.org_members.count({ where: { user_id: id } })
  console.log(`${created ? 'Created' : 'Existing'} user ${email} (${id}), in ${memberships} org(s)`)
  if (created) console.log(`Password: ${PASSWORD}`)
} catch (err) {
  console.error('Failed:', (err as Error).message)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
