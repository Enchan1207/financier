import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

import { FinancialYearValueSchema } from '@/domains/financial_year'
import { MonthsSchema } from '@/domains/monthly_context'
import dayjs from '@/logic/dayjs'

import { userAuthMiddleware } from '../authorize/middleware'
import {
  findFinancialMonthCotextsByDate,
  getFinancialMonthContext,
} from '../financial_month/dao'
import {
  getFinancialYear,
  insertFinancialYear,
  listFinancialYears,
} from './dao'
import type { PostFinancialYearCommand } from './workflow'
import { createFinancialYearPostWorkflow } from './workflow'

const app = new Hono<{ Bindings: Env }>()
  .use(userAuthMiddleware)
  .get(
    '/',
    zValidator('query', z.object({ order: z.enum(['asc', 'desc']) })),
    async (c) => {
      const order = c.req.valid('query').order

      const years = await listFinancialYears(c.env.D1)({
        userId: c.get('user').id,
        order,
      })

      return c.json(years)
    },
  )
  .get('/current', async (c) => {
    const userId = c.get('user').id
    const entity = await findFinancialMonthCotextsByDate(c.env.D1)({
      userId,
      date: dayjs(),
    })

    return entity ? c.json(entity) : c.json({ error: 'not found' }, 404)
  })
  .get(
    '/:year',
    zValidator('param', z.object({ year: z.coerce.number() })),
    async (c) => {
      const parseResult = FinancialYearValueSchema.safeParse(
        c.req.valid('param').year,
      )
      if (!parseResult.success) {
        return c.json({ error: 'bad request' }, 400)
      }

      const entity = await getFinancialYear(c.env.D1)({
        userId: c.get('user').id,
        financialYear: parseResult.data,
      })

      return entity ? c.json(entity) : c.json({ error: 'not found' }, 404)
    },
  )
  .get(
    '/:financialYear/:month',
    zValidator(
      'param',
      z.object({ financialYear: z.coerce.number(), month: z.coerce.number() }),
    ),
    async (c) => {
      const parseResult = z
        .object({
          financialYear: FinancialYearValueSchema,
          month: MonthsSchema,
        })
        .safeParse(c.req.valid('param'))
      if (!parseResult.success) {
        return c.json({ error: 'bad request' }, 400)
      }

      const entity = await getFinancialMonthContext(c.env.D1)({
        userId: c.get('user').id,
        info: parseResult.data,
      })

      return entity ? c.json(entity) : c.json({ error: 'not found' }, 404)
    },
  )
  .post(
    '/:year',
    zValidator('param', z.object({ year: z.coerce.number() })),
    zValidator('json', z.object({ standardIncomeTableId: z.string() })),
    async (c) => {
      const command: PostFinancialYearCommand = {
        input: {
          ...c.req.valid('param'),
          ...c.req.valid('json'),
        },
        state: { user: c.get('user') },
      }

      const workflow = createFinancialYearPostWorkflow({
        listFinancialYears: listFinancialYears(c.env.D1),
      })

      return workflow(command)
        .map(({ entity }) => insertFinancialYear(c.env.D1)(entity))
        .match(
          (created) => c.json(created, 201),
          (error) => {
            console.error(error)
            return c.json({ error: 'bad request' }, 400)
          },
        )
    },
  )

export default app
