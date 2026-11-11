import { Hono } from 'hono'
import type { Env } from '../middleware/auth'

// Starter/demo routes. Not used by the app; planned for removal (Phase 5).
// Delete this file and its two lines in index.ts to drop them.
export const demoRoutes = new Hono<Env>()

demoRoutes.all('/api/abc', (c) => {
  return c.json({ success: true })
})
demoRoutes.all('/api2/abc', (c) => {
  return c.json({ success: true })
})


// Landing Page
demoRoutes.get('/', (c) => {
  return c.text('Good morning!')
})

demoRoutes.get('/posts/:id', (c) => {
  const page = c.req.query('page')
  const id = c.req.param('id')
  c.header('X-Message', 'Hi!')
  return c.text(`You want to see ${page} of ${id}`)
})
