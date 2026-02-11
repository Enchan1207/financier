import { Hono } from 'hono'

import { jwkMiddleware } from './middlewares/auth'
import { dbMiddleware } from './middlewares/db'
import postsApp from './features/posts/route'
import usersApp from './features/users/route'

const app = new Hono()
  .basePath('/api')
  .use(jwkMiddleware)
  .use(dbMiddleware)
  .route('/posts', postsApp)
  .route('/users', usersApp)

export default app
export type AppType = typeof app
