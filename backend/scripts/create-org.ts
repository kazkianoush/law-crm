// Creates an organization and makes one existing user its owner.
//
//   bun run scripts/create-org.ts <owner-email> "<org name>"
//   e.g. bun run scripts/create-org.ts admin@admin.com "Smith & Co"
//
// Run from backend/ (it reads backend/.env). Writes straight to the database,
// so it needs no login token or running server.

import { prisma } from '../src/lib/prisma'

const [email, ...nameParts] = process.argv.slice(2)
const name = nameParts.join(' ').trim()

if (!email || !name) {
  console.error('Usage: bun run scripts/create-org.ts <owner-email> "<org name>"')
  process.exit(1)
}

try {
  // the owner must already have a profile row (they get one the first time they log in)
  const user = await prisma.public_users.findFirst({ where: { email } })
  if (!user) {
    console.error(`No user with email "${email}". Have they logged in at least once?`)
    process.exit(1)
  }

  // creates the org and the owner membership together, in one transaction
  const org = await prisma.orgs.create({
    data: {
      name,
      created_by: user.id,
      org_members: { create: { user_id: user.id, role: 'owner' } },
    },
  })

  console.log(`Created org "${org.name}" (${org.id}), owner: ${email}`)
} catch (err) {
  console.error('Failed:', (err as Error).message)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
