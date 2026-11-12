import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import type { Env } from '../middleware/auth'

// Everything organization related (orgs and their members).
export const orgRoutes = new Hono<Env>()

// ------------------------------------------------------------
// GET orgs for a given user
  //1. taking the userId, searching orgs_memebers, getting all rows where id matches
  //2. taking those rows and extracting orgIds
  //3. using orgIds to return Orgs inside Orgs table.
orgRoutes.get('/orgs', async (c) => {
  const id = c.get('userId')
  // we want to get all the orgs of this userId

  try {
    // get org_memebers objects where user_id is mentioned
    const user_orgs = await prisma.org_members.findMany({ where: {user_id: id}})
    //extract org_ids into traversible map
    const org_ids = user_orgs.map((m) => m.org_id)
    // match list of orgs if id is orgs_ids list above
    const orgs = await prisma.orgs.findMany({where: {id: {in: org_ids}}})
    return c.json(orgs)
  } catch (error) {
    console.log(error)
  }
})

orgRoutes.get('/orgs/:orgId', async (c) => {
  const orgId = c.req.param('orgId')
  try {
    // confirm member of org
    const me = await prisma.org_members.findUnique({
      where: { org_id_user_id: { org_id: orgId, user_id: c.get('userId') } },
    })
    if (!me) return c.json({ error: 'Not found' }, 404)
    
    // get the org
    const org = await prisma.orgs.findUnique({
      where: { id: orgId },
      select: { id: true, name: true },
    })
    if (!org) return c.json({ error: 'Not found' }, 404)

    return c.json({ ...org, role: me.role })   // { id, name, role }
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch org' }, 500)
  }
})


// ------------------------------------------------------------

orgRoutes.get('/orgs/:orgId/members', async (c) => {
  const orgId = c.req.param('orgId')

  try {
    // 1. Is the caller the owner in this org? If not, pretend it doesn't exist.
    const me = await prisma.org_members.findUnique({
      where: { org_id_user_id: { org_id: orgId, user_id: c.get('userId') }},
    })
    if (!me) return c.json({ error: 'Not found' }, 404)

    // 2. All rows for this org, joined to public.users in one query
    const rows = await prisma.org_members.findMany({
      where: { org_id: orgId },
      include: { users: true },   // `users` is the relation to public_users
    })

    // 3. Return only what the UI needs
    return c.json(
      rows.map((r) => ({
        user_id: r.user_id,
        name: r.users.name,
        email: r.users.email,
        role: r.role,
      }))
    )
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch members' }, 500)
  }
})

// ------------------------------------------------------------

// CREATE an org. Any logged-in user can; they become its owner.
orgRoutes.post('/orgs', async (c) => {
  const { name } = await c.req.json()
  if (!name || !String(name).trim()) {
    return c.json({ error: 'Name is required' }, 400)
  }
  try {
    // Nested create writes the org and the owner membership in one transaction,
    // so an org can never exist without an owner.
    const org = await prisma.orgs.create({
      data: {
        name: String(name).trim(),
        created_by: c.get('userId'),
        org_members: { create: { user_id: c.get('userId'), role: 'owner' } },
      },
    })
    return c.json(org, 201)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to create org' }, 500)
  }
})

// ------------------------------------------------------------

// ADD a member by email. Only owners/admins. The email must belong to an
// existing account (a row in public.users); nothing is added otherwise.
orgRoutes.post('/orgs/:orgId/members', async (c) => {
  const orgId = c.req.param('orgId')
  const body = await c.req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!email) return c.json({ error: 'Email is required' }, 400)

  try {
    // 1. Is the caller in this org? If not, pretend it doesn't exist.
    const me = await prisma.org_members.findUnique({
      where: { org_id_user_id: { org_id: orgId, user_id: c.get('userId')}},
    })
    if (!me) return c.json({ error: 'Not found' }, 404)

    // 2. Only owners and admins can add people.
    if (!['owner', 'admin'].includes(me.role)) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    // 3. Does an account with this email exist? (case-insensitive)
    const user = await prisma.public_users.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    })
    if (!user) return c.json({ error: 'No account with that email' }, 404)

    // 4. Already in this org?
    const existing = await prisma.org_members.findUnique({
      where: { org_id_user_id: { org_id: orgId, user_id: user.id } },
    })
    if (existing) return c.json({ error: 'Already a member' }, 409)

    // 5. Add them as a plain member.
    const member = await prisma.org_members.create({
      data: { org_id: orgId, user_id: user.id, role: 'member' },
    })
    return c.json(
      { user_id: member.user_id, name: user.name, email: user.email, role: member.role },
      201
    )
  } catch (error: any) {
    // two people adding the same account at once: the primary key rejects the second
    if (error?.code === 'P2002') return c.json({ error: 'Already a member' }, 409)
    console.error(error)
    return c.json({ error: 'Failed to add member' }, 500)
  }
})

// ------------------------------------------------------------

// CHANGE a member's role. Only owners can. An org must always keep >= 1 owner.
const ROLES = ['owner', 'admin', 'member']

orgRoutes.patch('/orgs/:orgId/members/:userId', async (c) => {
  const orgId = c.req.param('orgId')
  const targetId = c.req.param('userId')
  const body = await c.req.json().catch(() => ({}))
  const role = body.role

  if (typeof role !== 'string' || !ROLES.includes(role)) {
    return c.json({ error: 'Role must be owner, admin or member' }, 400)
  }

  try {
    // 1. Is the caller in this org? If not, pretend it doesn't exist.
    const me = await prisma.org_members.findUnique({
      where: { org_id_user_id: { org_id: orgId, user_id: c.get('userId') } },
    })
    if (!me) return c.json({ error: 'Not found' }, 404)

    // 2. Only owners can change roles.
    if (me.role !== 'owner') return c.json({ error: 'Forbidden' }, 403)

    // 3. Check + update in one serializable transaction, so two owners demoting
    //    each other at the same moment can't leave the org with no owner.
    const result = await prisma.$transaction(
      async (tx) => {
        const target = await tx.org_members.findUnique({
          where: { org_id_user_id: { org_id: orgId, user_id: targetId } },
        })
        if (!target) return { status: 404 as const, error: 'Member not found' }

        if (target.role === 'owner' && role !== 'owner') {
          const owners = await tx.org_members.count({
            where: { org_id: orgId, role: 'owner' },
          })
          if (owners <= 1) {
            return { status: 409 as const, error: 'An organization needs at least one owner' }
          }
        }

        const updated = await tx.org_members.update({
          where: { org_id_user_id: { org_id: orgId, user_id: targetId } },
          data: { role },
        })
        return { status: 200 as const, member: { user_id: updated.user_id, role: updated.role } }
      },
      { isolationLevel: 'Serializable' }
    )

    if ('error' in result) return c.json({ error: result.error }, result.status)
    return c.json(result.member)
  } catch (error: any) {
    // serializable conflict: someone else changed roles at the same moment
    if (error?.code === 'P2034') return c.json({ error: 'Please try again' }, 409)
    console.error(error)
    return c.json({ error: 'Failed to change role' }, 500)
  }
})
