import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requireAuth, type Env } from './middleware/auth'
import { demoRoutes } from './routes/demo'
import { orgRoutes } from './routes/orgs'
import { taskRoutes } from './routes/tasks'
import { userRoutes } from './routes/users'


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
for (const path of ['/tasks', '/tasks/*', '/users', '/users/*', '/orgs', '/orgs/*']) {
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

// Routes, grouped by resource (each file holds its full paths, so mount at '/').
// NOTE: a new top-level path (e.g. '/cases') must also be added to the auth
// list above, or it will be open to anyone.
app.route('/', demoRoutes)
app.route('/', taskRoutes)
app.route('/', userRoutes)
app.route('/', orgRoutes)


export default app
