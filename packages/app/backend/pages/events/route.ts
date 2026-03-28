import type { EventId } from '@backend/domains/event'
import { findEventById } from '@backend/features/events/repository'
import { sessionMiddleware } from '@backend/features/session/middleware'
import { Hono } from 'hono'

import { findEventSummaries, findEventTransactions } from './repository'

type EventSummaryResponse = {
  id: string
  name: string
  occurredOn: string
  totalAmount: number
  transactionCount: number
}

type EventTransactionResponse = {
  id: string
  date: string
  name: string
  amount: number
  type: 'income' | 'expense'
  categoryName: string
  categoryIcon: string
  categoryColor: string
}

type CategoryBreakdownResponse = {
  categoryName: string
  categoryIcon: string
  categoryColor: string
  amount: number
}

type EventDetailResponse = {
  id: string
  name: string
  occurredOn: string
  transactions: EventTransactionResponse[]
  categoryBreakdown: CategoryBreakdownResponse[]
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

    const rows = await findEventSummaries(db)(userId)

    const events: EventSummaryResponse[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      occurredOn: row.occurred_on,
      totalAmount: row.totalAmount,
      transactionCount: row.transactionCount,
    }))

    return c.json({ events })
  })
  .get('/:id', async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id') as EventId
    const db = c.get('db')
    const userId = session.userId

    const event = await findEventById(db)(id, userId)
    if (!event) {
      return c.json({ message: `イベントが見つかりません: ${id}` }, 404)
    }

    const txRows = await findEventTransactions(db)(id, userId)

    const transactions: EventTransactionResponse[] = txRows.map((row) => ({
      id: row.id,
      date: row.transaction_date,
      name: row.name,
      amount: row.amount,
      type: row.type as 'income' | 'expense',
      categoryName: row.category_name,
      categoryIcon: row.category_icon,
      categoryColor: row.category_color,
    }))

    const breakdownMap = new Map<string, CategoryBreakdownResponse>()
    for (const tx of transactions) {
      const key = tx.categoryName
      const existing = breakdownMap.get(key)
      if (existing) {
        existing.amount += tx.amount
      } else {
        breakdownMap.set(key, {
          categoryName: tx.categoryName,
          categoryIcon: tx.categoryIcon,
          categoryColor: tx.categoryColor,
          amount: tx.amount,
        })
      }
    }

    const detail: EventDetailResponse = {
      id: event.id,
      name: event.name,
      occurredOn: event.occurredOn.format('YYYY-MM-DD'),
      transactions,
      categoryBreakdown: Array.from(breakdownMap.values()),
    }

    return c.json({ event: detail })
  })

export default app
