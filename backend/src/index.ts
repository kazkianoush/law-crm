import { Hono } from 'hono'
import { supabase } from './lib/supabase'
import { prisma } from './lib/prisma'
import { cors } from 'hono/cors'
import { requireAuth, scope, type Env } from './middleware/auth'


const app = new Hono<Env>()

// cors
app.use('/api/*', cors())

// Only the frontend may call the task/user routes from a browser.
// This must come BEFORE requireAuth so the browser's preflight (OPTIONS)
// request, which carries no token, is answered instead of rejected.
const appCors = cors({
  origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3001',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
})
for (const path of ['/tasks', '/tasks/*', '/users', '/users/*']) {
  app.use(path, appCors)
  app.use(path, requireAuth)
}
app.use(
  '/api2/*',
  cors({
    origin: 'http://localhost:3000',
    allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
  })
)

app.all('/api/abc', (c) => {
  return c.json({ success: true })
})
app.all('/api2/abc', (c) => {
  return c.json({ success: true })
})


// Landing Page
app.get('/', (c) => {
  return c.text('Good morning!')
})

app.get('/posts/:id', (c) => {
  const page = c.req.query('page')
  const id = c.req.param('id')
  c.header('X-Message', 'Hi!')
  return c.text(`You want to see ${page} of ${id}`)
})

// ------------------------------------------------------------

// Read all tasks
app.get('/tasks', async (c) => {
  try {
    // admin: every task; user: only their own (see scope in middleware/auth.ts)
    const tasks = await prisma.task.findMany({ where: scope(c) })
    return c.json(tasks)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch tasks' }, 500)
  }
})

// ------------------------------------------------------------

// Read tasks for given user ID
app.get('/users/:id/tasks', async (c) => {
  const id = c.req.param('id')
  if (c.get('role') !== 'admin' && id !== c.get('userId')) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  try {
    const tasks = await prisma.task.findMany({
      where: { users_id: id }
    })
    return c.json(tasks)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch tasks' }, 500)
  }
})

// ------------------------------------------------------------

// GET users
app.get('/users', async (c) => {
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


// ------------------------------------------------------------

// CREATE task for given user ID
app.post('/users/:id/tasks', async (c) => {
  const id = c.req.param('id')
  // users can only create tasks for themselves; admins can create for anyone
  if (c.get('role') !== 'admin' && id !== c.get('userId')) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  const { title, description, status, due_date } = await c.req.json() 
  try {
    const task = await prisma.task.create({
      data: {
        users_id: id,
        title,
        description,
        status,
        due_date: new Date(due_date)
      }
    })
    return c.json(task, 201)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to create task' }, 500)
  }
})

// ------------------------------------------------------------

// UPDATE task for given task ID
app.patch('/tasks/:id', async (c) => {
  const id = c.req.param('id')                     
  const body = await c.req.json()                   

  if (body.title !== undefined && !String(body.title).trim()) {
    return c.json({ error: 'Title cannot be empty' }, 400)
  }
  if (body.due_date !== undefined && isNaN(new Date(body.due_date).getTime())) {
    return c.json({ error: 'Invalid due date' }, 400)
  }

  try {
    // scope(c) means a normal user can't find (so can't edit) someone else's task
    const existingTask = await prisma.task.findFirst({
      where: { id, ...scope(c) }
    })

    if (!existingTask) {
      return c.json({ error: 'Task not found' }, 404)
    }

    const updatedTask = await prisma.task.update({   
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.due_date !== undefined && { due_date: new Date(body.due_date) })
      }
    })

    return c.json(updatedTask)                       
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to update task' }, 500)
  }
})

// ------------------------------------------------------------

// DELETE task for given task ID
app.delete('/tasks/:id', async (c) => {
  const id = c.req.param('id')
  try {
    // scope(c) means a normal user can't find (so can't delete) someone else's task
    const existingTask = await prisma.task.findFirst({
      where: { id, ...scope(c) }
    })

    if (!existingTask) {
      return c.json({ error: 'Task not found' }, 404)
    }

    const task = await prisma.task.delete({
      where: { id }
    })
    return c.json(task)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to delete task' }, 500)
  }
})


export default app


