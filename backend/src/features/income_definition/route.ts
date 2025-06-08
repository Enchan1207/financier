import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { err, ok } from 'neverthrow'

import { EntityNotFoundError } from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'

import { userAuthMiddleware } from '../authorize/middleware'
import {
  findIncomeDefinitions,
  getIncomeDefinitionById,
  insertIncomeDefinition,
  updateIncomeDefinition,
} from './dao'
import type { GetIncomeDefinitionCommand } from './workflow/get'
import {
  createIncomeDefinitionGetWorkflow,
  GetIncomeDefinitionSchema,
} from './workflow/get'
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
  .get('/:id', zValidator('param', GetIncomeDefinitionSchema), async (c) => {
    const command: GetIncomeDefinitionCommand = {
      input: c.req.valid('param'),
      state: { user: c.get('user') },
    }

    const workflow = createIncomeDefinitionGetWorkflow({
      getIncomeDefinitionById: getIncomeDefinitionById(c.env.D1),
    })

    const response = workflow(command).match(
      (entity) => c.json(entity),
      (error) => {
        console.error(error)
        return c.json({ error: 'not found' }, 404)
      },
    )

    return response
  })
  .post('/', zValidator('json', PostIncomeDefinitionSchema), async (c) => {
    const command: PostIncomeDefinitionCommand = {
      input: c.req.valid('json'),
      state: { user: c.get('user') },
    }

    const workflow = createIncomeDefinitionPostWorkflow()

    const response = workflow(command)
      .asyncMap(({ entity }) => insertIncomeDefinition(c.env.D1)(entity))
      .match(
        (entity) => c.json(entity),
        (error) => {
          console.error(error)
          return c.json({ error: 'bad request' }, 400)
        },
      )

    return response
  })
  .put(
    '/:id',
    zValidator('query', PutIncomeDefinitionQuerySchema),
    zValidator('json', PutIncomeDefinitionBodySchema),
    async (c) => {
      const command: PutIncomeDefinitionCommand = {
        input: c.req.valid('json'),
        state: {
          id: c.req.valid('query').id,
          user: c.get('user'),
        },
      }

      const workflow = createIncomeDefinitionPutWorkflow({
        getIncomeDefinitionById: getIncomeDefinitionById(c.env.D1),
      })

      const response = workflow(command)
        .andThen(
          fromSafePromise(async (event) => {
            const id = event.current.id
            const updated = await updateIncomeDefinition(c.env.D1)(id, event)
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
