import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { scope, type Env } from '../middleware/auth'

// Everything task related. Paths are the full paths (mounted at '/' in index.ts),
// because tasks are reachable both at /tasks and under /users/:id/tasks.
export const taskRoutes = new Hono<Env>()

// ------------------------------------------------------------

// Read all tasks
taskRoutes.get('/tasks', async (c) => {
  try {
    // admin: every task; user: only their own (see scope in middleware/auth.ts)
    const tasks = await prisma.tasks.findMany({ where: scope(c) })
    return c.json(tasks)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch tasks' }, 500)
  }
})

// ------------------------------------------------------------

// Read tasks for given user ID
taskRoutes.get('/users/:id/tasks', async (c) => {
  const id = c.req.param('id')
  if (c.get('role') !== 'admin' && id !== c.get('userId')) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  try {
    const tasks = await prisma.tasks.findMany({
      where: { users_id: id }
    })
    return c.json(tasks)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch tasks' }, 500)
  }
})

// ------------------------------------------------------------

// CREATE task for given user ID
taskRoutes.post('/users/:id/tasks', async (c) => {
  const id = c.req.param('id')
  // users can only create tasks for themselves; admins can create for anyone
  if (c.get('role') !== 'admin' && id !== c.get('userId')) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  const { title, description, status, due_date } = await c.req.json()
  try {
    const task = await prisma.tasks.create({
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
taskRoutes.patch('/tasks/:id', async (c) => {
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
    const existingTask = await prisma.tasks.findFirst({
      where: { id, ...scope(c) }
    })

    if (!existingTask) {
      return c.json({ error: 'Task not found' }, 404)
    }

    const updatedTask = await prisma.tasks.update({
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
taskRoutes.delete('/tasks/:id', async (c) => {
  const id = c.req.param('id')
  try {
    // scope(c) means a normal user can't find (so can't delete) someone else's task
    const existingTask = await prisma.tasks.findFirst({
      where: { id, ...scope(c) }
    })

    if (!existingTask) {
      return c.json({ error: 'Task not found' }, 404)
    }

    const task = await prisma.tasks.delete({
      where: { id }
    })
    return c.json(task)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to delete task' }, 500)
  }
})
