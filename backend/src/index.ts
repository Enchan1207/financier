import { Hono } from 'hono'

import financialYears from '@/features/financial_year/route'
import incomeDefinitions from '@/features/income_definition/route'
import users from '@/features/profile/route'
import standardIncomes from '@/features/standard_income/route'
import { corsMiddleware } from '@/logic/middlewares/cors'

const app = new Hono()
  .use(corsMiddleware)
  .route('/users', users)
  .route('/financial_years', financialYears)
  .route('/income_definitions', incomeDefinitions)
  .route('/standard_incomes', standardIncomes)

export default app
export type AppType = typeof app
