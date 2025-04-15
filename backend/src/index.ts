import { Hono } from 'hono'

import users from '@/features/users/presentation/route'
import { corsMiddleware } from '@/logic/middlewares/cors'

const app = new Hono()
  .use(corsMiddleware)
  .route('/user', users)

export default app
export type AppType = typeof app
