import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

import { FinancialMonthValueSchema } from '@/domains/financial_month'
import { FinancialYearValueSchema } from '@/domains/financial_year'

import { userAuthMiddleware } from '../authorize/middleware'
import { getFinancialMonthByFinancialMonth } from '../financial_month/dao'
import { findWorkdayByFinancialMonthId } from './dao'
import type { GetWorkdayCommand } from './workflow/get'
import { createGetWorkdayWorkflow } from './workflow/get'

const app = new Hono<{ Bindings: Env }>()
  .use(userAuthMiddleware)
  .get(
    '/:financialYear/:month',
    zValidator('param', z.object({
      financialYear: FinancialYearValueSchema,
      month: FinancialMonthValueSchema,
    })),
    async (c) => {
      const command: GetWorkdayCommand = {
        input: { financialMonth: c.req.valid('param') },
        state: { user: c.get('user') },
      }

      const workflow = createGetWorkdayWorkflow({
        getFinancialMonthByFinancialMonth:
        getFinancialMonthByFinancialMonth(c.env.D1),
        findWorkdayByFinancialMonthId: findWorkdayByFinancialMonthId(c.env.D1),
      })

      const response = workflow(command)
        .match(
          entity => c.json(entity),
          (error) => {
            console.error(error)
            return c.json({ error: 'not found' }, 404)
          },
        )

      return response
    },
  )

export default app
