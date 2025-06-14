import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { err, ok } from 'neverthrow'
import { z } from 'zod'

import { EntityNotFoundError } from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'

import { userAuthMiddleware } from '../authorize/middleware'
import {
  findIncomeDefinitions,
  getIncomeDefinitionById,
  insertIncomeDefinition,
  updateIncomeDefinition,
} from './dao'
import type { UnvalidatedListIncomeDefinitionCommand } from './workflow/list'
import {
  createIncomeDefinitionListWorkflow,
  ListIncomeDefinitionSchema,
} from './workflow/list'
import type { PostIncomeDefinitionCommand } from './workflow/post'
import {
  createIncomeDefinitionPostWorkflow,
  PostIncomeDefinitionSchema,
} from './workflow/post'
import type { PutIncomeDefinitionCommand } from './workflow/put'
import {
  createIncomeDefinitionPutWorkflow,
  PutIncomeDefinitionBodySchema,
  PutIncomeDefinitionQuerySchema,
} from './workflow/put'

const app = new Hono<{ Bindings: Env }>()
  .use(userAuthMiddleware)
  .get('/', zValidator('query', ListIncomeDefinitionSchema), async (c) => {
    const command: UnvalidatedListIncomeDefinitionCommand = {
      input: c.req.valid('query'),
      state: { user: c.get('user') },
    }

    const workflow = createIncomeDefinitionListWorkflow({
      findIncomeDefinitions: findIncomeDefinitions(c.env.D1),
    })

    const response = workflow(command).match(
      (entities) => c.json(entities),
      (error) => {
        console.error(error)
        return c.json({ error: 'validation error' }, 400)
      },
    )

    return response
  })
  .get(
    '/:id',
    zValidator('param', z.object({ id: z.string().ulid() })),
    async (c) => {
      const userId = c.get('user').id
      const id = c.req.valid('param').id
      const stored = await getIncomeDefinitionById(c.env.D1)(userId, id)

      if (stored === undefined) {
        c.json({ error: 'not found' }, 404)
      }

      return c.json(stored)
    },
  )
  .post('/', zValidator('json', PostIncomeDefinitionSchema), async (c) => {
    const command: PostIncomeDefinitionCommand = {
      input: c.req.valid('json'),
      state: {
        user: c.get('user'),
      },
    }

    const workflow = createIncomeDefinitionPostWorkflow()

    const response = workflow(command)
      .asyncMap(({ entity }) => insertIncomeDefinition(c.env.D1)(entity))
      .match(
        (entity) => c.json(entity, 201),
        (error) => {
          console.error(error)
          return c.json({ error: 'bad request' }, 400)
        },
      )

    return response
  })
  .put(
    '/:id',
    zValidator('param', PutIncomeDefinitionQuerySchema),
    zValidator('json', PutIncomeDefinitionBodySchema),
    async (c) => {
      const command: PutIncomeDefinitionCommand = {
        input: c.req.valid('json'),
        state: {
          id: c.req.valid('param').id,
          user: c.get('user'),
        },
      }

      const workflow = createIncomeDefinitionPutWorkflow({
        getIncomeDefinitionById: getIncomeDefinitionById(c.env.D1),
      })

      const response = workflow(command)
        .andThen(
          fromSafePromise(async (event) => {
            const { id, userId } = event.current
            const updated = await updateIncomeDefinition(c.env.D1)(
              userId,
              id,
              event,
            )
            return updated
              ? ok(updated)
              : err(new Error('unexpected update error'))
          }),
        )
        .match(
          (entity) => c.json(entity),
          (error) => {
            console.error(error)

            if (error instanceof EntityNotFoundError) {
              return c.json({ error: 'not found' }, 404)
            }

            return c.json({ error: 'bad request' }, 400)
          },
        )

      return response
    },
  )

export default app
