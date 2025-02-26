import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createMiddleware } from 'hono/factory'

const app = new Hono()
  .use('/*', createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const corsMiddleware = cors({
      origin: c.env.CORS_ALLOW_ORIGINS,
      credentials: true,
    })
    return corsMiddleware(c, next)
  }))
  .get('/', (c) => {
    return c.json({ message: 'Hello, World!' })
  })

export default app
export type AppType = typeof app
