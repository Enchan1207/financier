import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { drizzle } from 'drizzle-orm/d1'
import { env } from 'hono/adapter'
import { createMiddleware } from 'hono/factory'

type Variables = {
  drizzle: DrizzleD1Database
}

export const dbMiddleware = createMiddleware<{
  Bindings: Env
  Variables: Variables
}>((c, next) => {
  const db = drizzle(env(c).D1)
  c.set('drizzle', db)

  return next()
})
