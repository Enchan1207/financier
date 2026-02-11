import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { Hono } from 'hono'

import type { User } from '../../domains/user'
import type { Auth0JWTPayload } from '../../middlewares/auth'
import { useAuth } from './middleware'

type Variables = {
  jwtPayload: Auth0JWTPayload
  drizzle: DrizzleD1Database
  user: User
}

const usersApp = new Hono<{ Variables: Variables }>()
  .use(useAuth())
  .get('/me', (c) => {
    const user = c.get('user')
    return c.json(user)
  })

export default usersApp
