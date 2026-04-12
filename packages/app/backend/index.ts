import authRoute from '@backend/features/auth/route'
import budgetRoute from '@backend/features/budgets/route'
import categoryRoute from '@backend/features/categories/route'
import eventTemplateRoute from '@backend/features/event-templates/route'
import eventRoute from '@backend/features/events/route'
import transactionRoute from '@backend/features/transactions/route'
import userRoute from '@backend/features/user/route'
import pagesRoute from '@backend/pages/index'
import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { logger } from 'hono/logger'

const app = new Hono<{ Bindings: Env }>()
  .use(logger())
  .use(csrf())
  .basePath('/api')
  .route('/auth', authRoute)
  .route('/users', userRoute)
  .route('/categories', categoryRoute)
  .route('/transactions', transactionRoute)
  .route('/events', eventRoute)
  .route('/event-templates', eventTemplateRoute)
  .route('/budgets', budgetRoute)
  .route('/pages', pagesRoute)

export default app
export type AppType = typeof app
