import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import z from 'zod'

import type { Auth0JWTPayload } from '../../middlewares/auth'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { User } from '../../domains/user'

import { findPostById, findPostsByUserId, savePost } from './repository'
import { buildCreatePostWorkflow } from './workflow'
import { useAuth } from '../users/middleware'

type Variables = {
  jwtPayload: Auth0JWTPayload
  drizzle: DrizzleD1Database
  user: User
}

const postsApp = new Hono<{ Variables: Variables }>()
  .use(useAuth())
  .get('/', async (c) => {
    const userId = c.get('user').id
    const db = c.get('drizzle')

    const posts = await findPostsByUserId(db)(userId)

    return c.json({ items: posts })
  })
  .get('/:id', zValidator('param', z.object({ id: z.string() })), async (c) => {
    const postId = c.req.valid('param').id as any
    const userId = c.get('user').id
    const db = c.get('drizzle')

    const post = await findPostById(db)(postId, userId)

    if (post === undefined) {
      return c.json({ message: 'Not Found' }, 404)
    }

    return c.json(post)
  })
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
      }),
    ),
    async (c) => {
      const body = c.req.valid('json')
      const userId = c.get('user').id
      const db = c.get('drizzle')

      const event = await buildCreatePostWorkflow(savePost(db))({
        input: {
          userId: userId,
          title: body.title,
          content: body.content,
        },
      })

      return c.json(event.created, 201)
    },
  )

export default postsApp
