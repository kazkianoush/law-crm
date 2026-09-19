import { Hono } from 'hono'
import { supabase } from './lib/supabase'
import { prisma } from './lib/prisma'
import { cors } from 'hono/cors'


const app = new Hono()

// cors
app.use('/api/*', cors())
app.use(
  '/api2/*',
  cors({
    origin: 'http://localhost:3001',
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

// Read tasks for given user ID
app.get('/users/:id/tasks', async (c) => {
  const id = c.req.param('id')
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
  const { data, error } = await supabase.from('users').select('*')
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
  try {
    const existingTask = await prisma.task.findUnique({  
      where: { id }
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
    const existingTask = await prisma.task.findUnique({
      where: { id }
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


