import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { err, ok } from 'neverthrow'
import { z } from 'zod'

import { FinancialMonthDataSchema } from '@/domains/financial_month'
import { WorkdayValueSchema } from '@/domains/workday/logic'
import { EntityNotFoundError } from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'

import { userAuthMiddleware } from '../authorize/middleware'
import { getFinancialMonthByFinancialMonth } from '../financial_month/dao'
import { findWorkdayByFinancialMonthId, updateWorkday } from './dao'
import type { GetWorkdayCommand } from './workflow/get'
import { createGetWorkdayWorkflow } from './workflow/get'
import type { PutWorkdayCommand } from './workflow/put'
import { createPutWorkdayWorkflow } from './workflow/put'

const app = new Hono<{ Bindings: Env }>()
  .use(userAuthMiddleware)
  .get(
    '/:financialYear/:month',
    zValidator('param', FinancialMonthDataSchema),
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
  .put(
    '/:financialYear/:month',
    zValidator('param', FinancialMonthDataSchema),
    zValidator('json', z.object({ count: WorkdayValueSchema })),
    async (c) => {
      const command: PutWorkdayCommand = {
        input: {
          count: c.req.valid('json').count,
          financialMonth: c.req.valid('param'),
        },
        state: { user: c.get('user') },
      }

      const workflow = createPutWorkdayWorkflow({
        getFinancialMonthByFinancialMonth:
        getFinancialMonthByFinancialMonth(c.env.D1),
      })

      const response = workflow(command)
        .andThen(fromSafePromise(async (event) => {
          const updated = await updateWorkday(c.env.D1)({
            userId: event.user.id,
            financialMonthId: event.financialMonth.id,
            count: event.count,
          })

          return updated
            ? ok(updated)
            : err(new EntityNotFoundError({ id: event.financialMonth.id }))
        }))
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
