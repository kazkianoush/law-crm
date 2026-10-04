import type { Context, Next } from 'hono'
import { supabase } from '../lib/supabase'

// Tells Hono what c.get('userId') and c.get('role') return
export type Env = {
  Variables: { userId: string; role: 'admin' | 'user' }
}

export async function requireAuth(c: Context<Env>, next: Next) {
  // 1. Pull the token out of "Authorization: Bearer <token>"
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  // 2. Ask Supabase whether the token is valid and whose it is
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return c.json({ error: 'Unauthorized' }, 401)

  const user = data.user

  // 3. Remember who this is for the route handlers
  c.set('userId', user.id)
  c.set('role', user.app_metadata?.role === 'admin' ? 'admin' : 'user')

  // 4. First time we see this person, create their row in the users table
  const { error: upsertError } = await supabase.from('users').upsert(
    { id: user.id, name: user.email?.split('@')[0] ?? 'user', email: user.email },
    { onConflict: 'id', ignoreDuplicates: true }
  )
  if (upsertError) console.error(upsertError)

  await next() // 5. Continue to the actual route
}

// Use inside a Prisma `where`: admins get no filter, everyone else only their own rows
export function scope(c: Context<Env>) {
  return c.get('role') === 'admin' ? {} : { users_id: c.get('userId') }
}
