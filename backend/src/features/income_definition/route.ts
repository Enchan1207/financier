import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import { userAuthMiddleware } from '../authorize/middleware'
import {
  findIncomeDefinitions, getIncomeDefinitionById, insertIncomeDefinition,
} from './dao'
import type { GetIncomeDefinitionCommand } from './workflow/get'
import { createIncomeDefinitionGetWorkflow, GetIncomeDefinitionSchema } from './workflow/get'
import type { UnvalidatedListIncomeDefinitionCommand } from './workflow/list'
import { createIncomeDefinitionListWorkflow, ListIncomeDefinitionSchema } from './workflow/list'
import type { UnvalidatedPostIncomeDefinitionCommand } from './workflow/post'
import { createIncomeDefinitionPostWorkflow, PostIncomeDefinitionSchema } from './workflow/post'

const app = new Hono<{ Bindings: Env }>()
  .use(userAuthMiddleware)
  .get(
    '/',
    zValidator('query', ListIncomeDefinitionSchema),
    async (c) => {
      const command: UnvalidatedListIncomeDefinitionCommand = {
        input: c.req.valid('query'),
        state: { user: c.get('user') },
      }

      const workflow = createIncomeDefinitionListWorkflow({
        //
        findIncomeDefinitions: findIncomeDefinitions(c.env.D1),
      })

      const response = await workflow(command)
        .match(
          entities => c.json(entities),
          (error) => {
            console.error(error)
            return c.json({ error: 'validation error' }, 400)
          },
        )

      return response
    })
  .get(
    '/:id',
    zValidator('param', GetIncomeDefinitionSchema),
    async (c) => {
      const command: GetIncomeDefinitionCommand = {
        input: c.req.valid('param'),
        state: { user: c.get('user') },
      }

      const workflow = createIncomeDefinitionGetWorkflow({
        //
        getIncomeDefinitionById: getIncomeDefinitionById(c.env.D1),
      })

      const response = await workflow(command)
        .match(entity => c.json(entity), (error) => {
          console.error(error)
          return c.json({ error: 'not found' }, 404)
        })

      return response
    },
  )
  .post(
    '/',
    zValidator('json', PostIncomeDefinitionSchema),
    async (c) => {
      const command: UnvalidatedPostIncomeDefinitionCommand = {
        input: c.req.valid('json'),
        state: { user: c.get('user') },
      }

      const workflow = createIncomeDefinitionPostWorkflow()

      const response = await workflow(command)
        .asyncMap(({ entity }) => insertIncomeDefinition(c.env.D1)(entity))
        .match(entity => c.json(entity), (error) => {
          console.error(error)
          return c.json({ error: 'bad request' }, 400)
        })

      return response
    },
  )

export default app
