import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { err, ok } from 'neverthrow'
import { z } from 'zod'

import { EntityNotFoundError } from '@/logic/errors'

import { userAuthMiddleware } from '../authorize/middleware'
import {
  getStandardIncomeTable,
  insertStandardIncomeTable,
  listStandardIncomeTables,
  updateStandardIncomeTableGrades,
  updateStandardIncomeTableName,
} from './dao'
import type { DuplicateStandardIncomeTableCommand } from './workflow/duplicate'
import { createStandardIncomeTableDuplicateWorkflow } from './workflow/duplicate'
import type { GetStandardIncomeTableCommand } from './workflow/get'
import {
  createStandardIncomeTableGetWorkflow,
  GetStandardIncomeTableSchema,
} from './workflow/get'
import type { UnvalidatedListStandardIncomeTablesCommand } from './workflow/list'
import {
  createStandardIncomeTablesListWorkflow,
  ListStandardIncomeTablesSchema,
} from './workflow/list'
import type { PostStandardIncomeTableCommand } from './workflow/post'
import {
  createStandardIncomeTablePostWorkflow,
  PostStandardIncomeTableSchema,
} from './workflow/post'
import type { UpdateStandardIncomeTableGradesCommand } from './workflow/updateGrades'
import { createStandardIncomeTableGradesUpdateWorkflow } from './workflow/updateGrades'
import type { UpdateStandardIncomeTableNameCommand } from './workflow/updateName'
import { createStandardIncomeTableNameUpdateWorkflow } from './workflow/updateName'

const app = new Hono<{ Bindings: Env }>()
  .use(userAuthMiddleware)
  // 標準報酬月額表の一覧を取得
  .get('/', zValidator('query', ListStandardIncomeTablesSchema), async (c) => {
    const command: UnvalidatedListStandardIncomeTablesCommand = {
      input: c.req.valid('query'),
      state: { user: c.get('user') },
    }

    const workflow = createStandardIncomeTablesListWorkflow({
      listStandardIncomeTables: listStandardIncomeTables(c.env.D1),
    })

    const response = await workflow(command)
    return c.json(response)
  })

  // 単一の標準報酬月額表を取得
  .get('/:id', zValidator('param', GetStandardIncomeTableSchema), async (c) => {
    const command: GetStandardIncomeTableCommand = {
      input: c.req.valid('param'),
      state: { user: c.get('user') },
    }

    const workflow = createStandardIncomeTableGetWorkflow({
      getStandardIncomeTable: getStandardIncomeTable(c.env.D1),
    })

    return workflow(command).match(
      (entity) => c.json(entity),
      (error) => {
        console.error(error)
        return c.json({ error: 'not found' }, 404)
      },
    )
  })

  // 新規標準報酬月額表を作成
  .post('/', zValidator('json', PostStandardIncomeTableSchema), async (c) => {
    const command: PostStandardIncomeTableCommand = {
      input: c.req.valid('json'),
      state: { user: c.get('user') },
    }

    const workflow = createStandardIncomeTablePostWorkflow()

    return workflow(command)
      .asyncMap(({ entity }) => insertStandardIncomeTable(c.env.D1)(entity))
      .match(
        (entity) => c.json(entity, 201),
        (error) => {
          console.error(error)
          return c.json({ error: 'bad request' }, 400)
        },
      )
  })

  // 標準報酬月額表を更新（名前または階級）
  .patch(
    '/:id',
    zValidator('param', z.object({ id: z.string().ulid() })),
    zValidator(
      'json',
      z.object({
        name: z.string().optional(),
        grades: z
          .array(
            z.object({
              threshold: z.number().int().min(0),
              standardIncome: z.number().int().min(0),
            }),
          )
          .optional(),
      }),
    ),
    async (c) => {
      const id = c.req.valid('param').id
      const { name, grades } = c.req.valid('json')

      // いずれか一方しか更新できない
      if (name !== undefined && grades !== undefined) {
        return c.json({ error: 'bad request' }, 400)
      }

      if (name !== undefined) {
        const command: UpdateStandardIncomeTableNameCommand = {
          input: {
            id,
            name,
          },
          state: { user: c.get('user') },
        }

        const workflow = createStandardIncomeTableNameUpdateWorkflow({
          getStandardIncomeTable: getStandardIncomeTable(c.env.D1),
        })

        const response = workflow(command)
          .map(({ current: { userId, id }, update: { name } }) =>
            updateStandardIncomeTableName(c.env.D1)({
              userId,
              id,
              name,
            }),
          )
          .andThen((updated) =>
            updated ? ok(updated) : err(new EntityNotFoundError({ id })),
          )
          .match(
            (entity) => c.json(entity),
            (error) => {
              console.error(error)
              return c.json({ error: 'not found' }, 404)
            },
          )

        return response
      }

      if (grades !== undefined) {
        const command: UpdateStandardIncomeTableGradesCommand = {
          input: {
            id,
            grades,
          },
          state: { user: c.get('user') },
        }

        const workflow = createStandardIncomeTableGradesUpdateWorkflow({
          getStandardIncomeTable: getStandardIncomeTable(c.env.D1),
        })

        const response = workflow(command)
          .map(({ current: { userId, id }, update: { grades } }) =>
            updateStandardIncomeTableGrades(c.env.D1)({
              userId,
              id,
              grades,
            }),
          )
          .andThen((updated) =>
            updated ? ok(updated) : err(new EntityNotFoundError({ id })),
          )
          .match(
            (entity) => c.json(entity),
            (error) => {
              console.error(error)
              return c.json({ error: 'not found' }, 404)
            },
          )

        return response
      }

      // 何がしたいねんお前
      return c.json({ error: 'bad request' }, 400)
    },
  )

  // 標準報酬月額表を複製
  .post(
    '/:id/duplicate',
    zValidator('param', z.object({ id: z.string().ulid() })),
    zValidator('json', z.object({ name: z.string() })),
    async (c) => {
      const command: DuplicateStandardIncomeTableCommand = {
        input: {
          id: c.req.valid('param').id,
          name: c.req.valid('json').name,
        },
        state: { user: c.get('user') },
      }

      const workflow = createStandardIncomeTableDuplicateWorkflow({
        getStandardIncomeTable: getStandardIncomeTable(c.env.D1),
      })

      const response = workflow(command)
        .map(({ entity }) => insertStandardIncomeTable(c.env.D1)(entity))
        .match(
          (entity) => c.json(entity),
          (error) => {
            console.error(error)
            return c.json({ error: 'bad request' }, 400)
          },
        )

      return response
    },
  )

export default app
