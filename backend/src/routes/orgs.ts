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
