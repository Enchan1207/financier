import type { CategoryId } from '@backend/domains/category'
import type { EventTemplateId } from '@backend/domains/event-template'
import { findCategoriesByIds } from '@backend/features/categories/repository'
import { sessionMiddleware } from '@backend/features/session/middleware'
import { zValidator } from '@hono/zod-validator'
import { Result } from '@praha/byethrow'
import { Hono } from 'hono'

import { EventTemplateNotFoundException } from './exceptions'
import {
  deleteEventTemplate,
  findEventTemplateById,
  findEventTemplateWithCategoriesById,
  saveEventTemplate,
  saveEventWithTransactions,
} from './repository'
import {
  CreateEventTemplateRequestSchema,
  RegisterEventTemplateRequestSchema,
  UpdateEventTemplateRequestSchema,
} from './schema'
import { buildCreateEventTemplateWorkflow } from './workflows/create'
import { buildDeleteEventTemplateWorkflow } from './workflows/delete'
import { buildRegisterEventTemplateWorkflow } from './workflows/register'
import { buildUpdateEventTemplateWorkflow } from './workflows/update'

type EventTemplateResponse = {
  id: string
  name: string
  defaultTransactions: Array<{
    categoryId: string
    name: string
    amount: number
  }>
}

const toEventTemplateResponse = (template: {
  id: string
  name: string
  defaultTransactions: Array<{
    categoryId: string
    name: string
    amount: number
  }>
}): EventTemplateResponse => ({
  id: template.id,
  name: template.name,
  defaultTransactions: template.defaultTransactions,
})

const app = new Hono<{ Bindings: Env }>()
  .use(sessionMiddleware)
  .post(
    '/',
    zValidator('json', CreateEventTemplateRequestSchema),
    async (c) => {
      const session = c.get('session')
      if (session === undefined) {
        return c.json({ message: 'Unauthorized' }, 401)
      }

      const body = c.req.valid('json')
      const db = c.get('db')

      const workflow = buildCreateEventTemplateWorkflow({
        findCategoriesByIds: findCategoriesByIds(db),
      })

      const result = await workflow({
        input: {
          name: body.name,
          defaultTransactions: body.defaultTransactions.map((tx) => ({
            categoryId: tx.categoryId as CategoryId,
            name: tx.name,
            amount: tx.amount,
          })),
        },
        context: { userId: session.userId },
      })

      if (Result.isFailure(result)) {
        return c.json({ message: result.error.message }, 400)
      }

      await saveEventTemplate(db)(result.value.template)

      return c.json(
        { template: toEventTemplateResponse(result.value.template) },
        201,
      )
    },
  )
  .put(
    '/:id',
    zValidator('json', UpdateEventTemplateRequestSchema),
    async (c) => {
      const session = c.get('session')
      if (session === undefined) {
        return c.json({ message: 'Unauthorized' }, 401)
      }

      const id = c.req.param('id') as EventTemplateId
      const body = c.req.valid('json')
      const db = c.get('db')

      const workflow = buildUpdateEventTemplateWorkflow({
        findEventTemplateById: findEventTemplateById(db),
        findCategoriesByIds: findCategoriesByIds(db),
      })

      const result = await workflow({
        input: {
          id,
          name: body.name,
          defaultTransactions: body.defaultTransactions?.map((tx) => ({
            categoryId: tx.categoryId as CategoryId,
            name: tx.name,
            amount: tx.amount,
          })),
        },
        context: { userId: session.userId },
      })

      if (Result.isFailure(result)) {
        if (result.error instanceof EventTemplateNotFoundException) {
          return c.json({ message: result.error.message }, 404)
        }
        return c.json({ message: result.error.message }, 400)
      }

      await saveEventTemplate(db)(result.value.template)

      return c.json({
        template: toEventTemplateResponse(result.value.template),
      })
    },
  )
  .delete('/:id', async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id') as EventTemplateId
    const db = c.get('db')

    const workflow = buildDeleteEventTemplateWorkflow({
      findEventTemplateById: findEventTemplateById(db),
    })

    const result = await workflow({
      input: { id },
      context: { userId: session.userId },
    })

    if (Result.isFailure(result)) {
      return c.json({ message: result.error.message }, 404)
    }

    await deleteEventTemplate(db)(result.value.template.id)

    return c.json({ template: toEventTemplateResponse(result.value.template) })
  })
  .post(
    '/:id/register',
    zValidator('json', RegisterEventTemplateRequestSchema),
    async (c) => {
      const session = c.get('session')
      if (session === undefined) {
        return c.json({ message: 'Unauthorized' }, 401)
      }

      const id = c.req.param('id') as EventTemplateId
      const body = c.req.valid('json')
      const db = c.get('db')

      const workflow = buildRegisterEventTemplateWorkflow({
        findEventTemplateWithCategoriesById:
          findEventTemplateWithCategoriesById(db),
      })

      const result = await workflow({
        input: {
          id,
          occurredOn: body.occurredOn,
          items: body.items.map((item) => ({
            categoryId: item.categoryId as CategoryId,
            name: item.name,
            amount: item.amount,
          })),
        },
        context: { userId: session.userId },
      })

      if (Result.isFailure(result)) {
        if (result.error instanceof EventTemplateNotFoundException) {
          return c.json({ message: result.error.message }, 404)
        }
        return c.json({ message: result.error.message }, 400)
      }

      const { event, transactions } = result.value

      await saveEventWithTransactions(db)(event, transactions)

      return c.json({ eventId: event.id }, 201)
    },
  )

export default app
