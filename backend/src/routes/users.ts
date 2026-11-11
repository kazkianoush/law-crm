import { Hono } from 'hono'
import { supabase } from '../lib/supabase'
import type { Env } from '../middleware/auth'

// Everything about the users table itself. (A user's tasks live in tasks.ts.)
export const userRoutes = new Hono<Env>()

// ------------------------------------------------------------

// GET users
userRoutes.get('/users', async (c) => {
  // admin: everyone; user: only their own row
  let query = supabase.from('users').select('*')
  if (c.get('role') !== 'admin') {
    query = query.eq('id', c.get('userId'))
  }
  const { data, error } = await query
  if (error) {
    console.error(error)
    return c.json({ error: error.message }, 500)
  }
  return c.json(data)
})
