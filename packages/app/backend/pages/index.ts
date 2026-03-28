import eventsPageRoute from '@backend/pages/events/route'
import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>().route('/events', eventsPageRoute)

export default app
