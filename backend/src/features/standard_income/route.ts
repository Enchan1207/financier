import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { err, ok } from 'neverthrow'
import { z } from 'zod'

import { EntityNotFoundError } from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'

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
import type { PostStandardIncomeTableCommand } from './workflow/post'
import {
  createStandardIncomeTablePostWorkflow,
  PostStandardIncomeTableSchema,
} from './workflow/post'
import type { UpdateStandardIncomeTableCommand } from './workflow/update'
import { createStandardIncomeTableUpdateWorkflow } from './workflow/update'

const app = new Hono<{ Bindings: Env }>()
  .use(userAuthMiddleware)
  // 標準報酬月額表の一覧を取得
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        // 未指定なら昇順
        order: z.enum(['asc', 'desc']).optional().default('asc'),
      }),
    ),
    async (c) => {
      const entities = await listStandardIncomeTables(c.env.D1)({
        userId: c.get('user').id,
        order: c.req.valid('query').order,
      })

      return c.json(entities)
    },
  )

  // 単一の標準報酬月額表を取得
  .get('/:id', zValidator('param', z.object({ id: z.string() })), async (c) => {
    const stored = await getStandardIncomeTable(c.env.D1)({
      userId: c.get('user').id,
      id: c.req.valid('param').id,
    })

    if (stored === undefined) {
      return c.json({ error: 'not found' }, 404)
    }

    return c.json(stored)
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
              threshold: z.number(),
              standardIncome: z.number(),
            }),
          )
          .optional(),
      }),
    ),
    async (c) => {
      const command: UpdateStandardIncomeTableCommand = {
        input: {
          ...c.req.valid('json'),
          ...c.req.valid('param'),
        },
        state: {
          user: c.get('user'),
        },
      }

      const workflow = createStandardIncomeTableUpdateWorkflow()

      const response = workflow(command)
        .asyncAndThen(
          fromSafePromise(async (event) => {
            if (event.kind === 'grades') {
              const result = await updateStandardIncomeTableGrades(c.env.D1)(
                event,
              )
              return result !== undefined
                ? ok(result)
                : err(new EntityNotFoundError({ id: event.id }))
            }

            const result = await updateStandardIncomeTableName(c.env.D1)(event)
            return result !== undefined
              ? ok(result)
              : err(new EntityNotFoundError({ id: event.id }))
          }),
        )
        .match(
          (entity) => c.json(entity),
          (error) => {
            if (error instanceof EntityNotFoundError) {
              return c.json({ error: 'not found' }, 404)
            }

            console.error(error)
            return c.json({ error: 'bad request' }, 400)
          },
        )

      return response
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
