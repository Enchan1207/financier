import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

import { EntityNotFoundError } from '@/logic/errors'

import { userAuthMiddleware } from '../authorize/middleware'
import { getFinancialMonthContext } from '../financial_month/dao'
import { listIncomeRecordItems } from './dao'
import type { UnvalidatedListIncomeRecordCommand } from './workflow'
import { createIncomeRecordListWorkflow } from './workflow'

const app = new Hono<{ Bindings: Env }>()
  .use(userAuthMiddleware)
  // ある会計月度における報酬の詳細を取得
  .get(
    '/:financialYear/:month',
    zValidator(
      'param',
      z.object({
        financialYear: z.coerce.number(),
        month: z.coerce.number(),
      }),
    ),
    async (c) => {
      const command: UnvalidatedListIncomeRecordCommand = {
        input: c.req.valid('param'),
        state: {
          user: c.get('user'),
        },
      }

      const workflow = createIncomeRecordListWorkflow({
        getFinancialMonthContext: getFinancialMonthContext(c.env.D1),
        listIncomeRecordItems: listIncomeRecordItems(c.env.D1),
      })

      const response = workflow(command).match(
        ({ items }) => c.json(items),
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
