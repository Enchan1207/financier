import budgetsPageRoute from '@backend/pages/budgets/route'
import categoriesPageRoute from '@backend/pages/categories/route'
import eventTemplatesPageRoute from '@backend/pages/event-templates/route'
import eventsPageRoute from '@backend/pages/events/route'
import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()
  .route('/budgets', budgetsPageRoute)
  .route('/categories', categoriesPageRoute)
  .route('/events', eventsPageRoute)
  .route('/event-templates', eventTemplatesPageRoute)

export default app
