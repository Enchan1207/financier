import type { EventId } from '@backend/domains/event'
import { createEvent } from '@backend/domains/event'
import { sessionMiddleware } from '@backend/features/session/middleware'
import dayjs from '@backend/lib/date'
import { zValidator } from '@hono/zod-validator'
import { Result } from '@praha/byethrow'
import { Hono } from 'hono'

import { EventNotFoundException } from './exceptions'
import {
  deleteEvent,
  findEventById,
  findTransactionCountByEventId,
  saveEvent,
} from './repository'
import { CreateEventRequestSchema, UpdateEventRequestSchema } from './schema'
import { buildDeleteEventWorkflow } from './workflows/delete'
import { buildUpdateEventWorkflow } from './workflows/update'

type EventResponse = {
  id: string
  name: string
  occurredOn: string
}

const toEventResponse = (event: {
  id: string
  name: string
  occurredOn: { format: (f: string) => string }
}): EventResponse => ({
  id: event.id,
  name: event.name,
  occurredOn: event.occurredOn.format('YYYY-MM-DD'),
})

const app = new Hono<{ Bindings: Env }>()
  .use(sessionMiddleware)
  .post('/', zValidator('json', CreateEventRequestSchema), async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const body = c.req.valid('json')
    const db = c.get('db')

    const event = createEvent({
      userId: session.userId,
      name: body.name,
      occurredOn: dayjs(body.occurredOn),
    })

    await saveEvent(db)(event)

    return c.json({ event: toEventResponse(event) }, 201)
  })
  .put('/:id', zValidator('json', UpdateEventRequestSchema), async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id') as EventId
    const body = c.req.valid('json')
    const db = c.get('db')

    const workflow = buildUpdateEventWorkflow({
      findEventById: findEventById(db),
    })

    const result = await workflow({
      input: { id, name: body.name, occurredOn: body.occurredOn },
      context: { userId: session.userId },
    })

    if (Result.isFailure(result)) {
      return c.json({ message: result.error.message }, 404)
    }

    await saveEvent(db)(result.value.event)

    return c.json({ event: toEventResponse(result.value.event) })
  })
  .delete('/:id', async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id') as EventId
    const db = c.get('db')

    const workflow = buildDeleteEventWorkflow({
      findEventById: findEventById(db),
      findTransactionCountByEventId: findTransactionCountByEventId(db),
    })

    const result = await workflow({
      input: { id },
      context: { userId: session.userId },
    })

    if (Result.isFailure(result)) {
      if (result.error instanceof EventNotFoundException) {
        return c.json({ message: result.error.message }, 404)
      }
      return c.json({ message: result.error.message }, 409)
    }

    await deleteEvent(db)(result.value.event.id)

    return c.json({ event: toEventResponse(result.value.event) })
  })

export default app
