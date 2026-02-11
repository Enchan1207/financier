import { zValidator } from '@hono/zod-validator'
import type { InferSelectModel } from 'drizzle-orm'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import z from 'zod'

import { jwkMiddleware } from './auth'
import { dbMiddleware } from './db'
import { postsTable } from './schema'

// FIXME: あんまり綺麗じゃない、というかそもそもレコードをそのままレスポンスにするな
type Model = InferSelectModel<typeof postsTable>

const app = new Hono()
  .basePath('/api')
  .use(jwkMiddleware)
  .use(dbMiddleware)
  .get('/posts', async (c) => {
    const userId = c.get('jwtPayload').sub
    const records = await c
      .get('drizzle')
      .select()
      .from(postsTable)
      .where(eq(postsTable.user_id, userId))

    return c.json({ items: records })
  })
  .get(
    '/posts/:id',
    zValidator('param', z.object({ id: z.string() })),
    async (c) => {
      const id = c.req.valid('param').id
      const userId = c.get('jwtPayload').sub
      const item: Model | undefined = await c
        .get('drizzle')
        .select()
        .from(postsTable)
        .where(and(eq(postsTable.id, id), eq(postsTable.user_id, userId)))
        .then((records) => records.at(0))

      if (item === undefined) {
        return c.json({ message: 'Not Found' }, 404)
      }

      return c.json(item)
    },
  )
  .post(
    '/posts',
    zValidator(
      'json',
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
      }),
    ),
    async (c) => {
      const body = c.req.valid('json')
      const userId = c.get('jwtPayload').sub

      const inserted = await c
        .get('drizzle')
        .insert(postsTable)
        .values({
          id: crypto.randomUUID(),
          user_id: userId,
          title: body.title,
          content: body.content,
        })
        .returning()

      return c.json(inserted, 201)
    },
  )

export default app
export type AppType = typeof app
