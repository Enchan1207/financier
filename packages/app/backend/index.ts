import { Hono } from 'hono'

import postsApp from './features/posts/route'
import usersApp from './features/users/route'
import { jwkMiddleware } from './middlewares/auth'
import { dbMiddleware } from './middlewares/db'

const app = new Hono()
  .basePath('/api')
  .use(jwkMiddleware)
  .use(dbMiddleware)
  .route('/posts', postsApp)
  .route('/users', usersApp)

export default app
export type AppType = typeof app
