import type { EventTemplateId } from '@backend/domains/event-template'
import { sessionMiddleware } from '@backend/features/session/middleware'
import { Hono } from 'hono'

import {
  findEventTemplateDetail,
  findEventTemplateSummaries,
} from './repository'

type EventTemplateSummaryResponse = {
  id: string
  name: string
  items: Array<{
    categoryName: string
    name: string
    defaultAmount: number
    type: 'income' | 'expense'
  }>
}

type EventTemplateDetailResponse = {
  id: string
  name: string
  items: Array<{
    categoryId: string
    categoryName: string
    name: string
    defaultAmount: number
    type: 'income' | 'expense'
  }>
}

const app = new Hono<{ Bindings: Env }>()
  .use(sessionMiddleware)
  .get('/', async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const db = c.get('db')
    const userId = session.userId

    const rows = await findEventTemplateSummaries(db)(userId)

    const templates: EventTemplateSummaryResponse[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      items: row.items,
    }))

    return c.json({ templates })
  })
  .get('/:id', async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id') as EventTemplateId
    const db = c.get('db')
    const userId = session.userId

    const row = await findEventTemplateDetail(db)(id, userId)
    if (!row) {
      return c.json(
        { message: `イベントテンプレートが見つかりません: ${id}` },
        404,
      )
    }

    const template: EventTemplateDetailResponse = {
      id: row.id,
      name: row.name,
      items: row.items,
    }

    return c.json({ template })
  })

export default app
