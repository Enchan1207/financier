import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

import { FinancialMonthDataSchema } from '@/domains/financial_month'
import { FinancialYearValueSchema } from '@/domains/financial_year'
import dayjs from '@/logic/dayjs'

import { userAuthMiddleware } from '../authorize/middleware'
import { findFinancialMonthsByDate, getFinancialMonthByFinancialMonth } from '../financial_month/dao'
import {
  getFinancialYear, insertFinancialYear, listFinancialYears,
} from './dao'
import type { PostFinancialYearCommand } from './workflow'
import { createFinancialYearPostWorkflow, PostFinancialYearSchema } from './workflow'

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
    })
  .get(
    '/:year',
    zValidator('param', z.object({ year: FinancialYearValueSchema })),
    async (c) => {
      const financialYear = c.req.valid('param').year

      const entity = await getFinancialYear(c.env.D1)({
        userId: c.get('user').id,
        financialYear,
      })

      return entity ? c.json(entity) : c.json({ error: 'not found' }, 404)
    })
  .get(
    '/:financialYear/:month',
    zValidator('param', FinancialMonthDataSchema),
    async (c) => {
      const financialMonthData = c.req.valid('param')

      const entity = await getFinancialMonthByFinancialMonth(c.env.D1)(
        c.get('user').id,
        financialMonthData,
      )

      return entity ? c.json(entity) : c.json({ error: 'not found' }, 404)
    })
  .get(
    '/current',
    async (c) => {
      const userId = c.get('user').id
      const entity = await findFinancialMonthsByDate(c.env.D1)(userId, dayjs())

      return entity ? c.json(entity) : c.json({ error: 'not found' }, 404)
    },
  )
  .post(
    '/:year',
    zValidator('param', PostFinancialYearSchema),
    async (c) => {
      const command: PostFinancialYearCommand = {
        input: { year: c.req.valid('param').year },
        state: { user: c.get('user') },
      }

      const workflow = createFinancialYearPostWorkflow({
        //
        listFinancialYears: listFinancialYears(c.env.D1),
      })

      return workflow(command)
        .map(({ entity }) => insertFinancialYear(c.env.D1)(entity))
        .match(
          created => c.json(created),
          (error) => {
            console.error(error)
            return c.json({ error: 'bad request' }, 400)
          },
        )
    },
  )

export default app
