import categoriesPageRoute from '@backend/pages/categories/route'
import eventsPageRoute from '@backend/pages/events/route'
import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()
  .route('/categories', categoriesPageRoute)
  .route('/events', eventsPageRoute)

export default app
