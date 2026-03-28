import type { EventId } from '@backend/domains/event'
import type { UserId } from '@backend/domains/user'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { categoriesTable } from '@backend/schemas/categories'
import { eventsTable } from '@backend/schemas/events'
import { transactionsTable } from '@backend/schemas/transactions'
import { and, desc, eq, sql } from 'drizzle-orm'

export type EventSummaryRow = {
  id: string
  name: string
  occurred_on: string
  totalAmount: number
  transactionCount: number
}

export type EventTransactionRow = {
  id: string
  transaction_date: string
  name: string
  amount: number
  type: string
  category_name: string
  category_icon: string
  category_color: string
}

export const findEventSummaries =
  (db: DrizzleDatabase) =>
  async (userId: UserId): Promise<EventSummaryRow[]> => {
    return db
      .select({
        id: eventsTable.id,
        name: eventsTable.name,
        occurred_on: eventsTable.occurred_on,
        totalAmount: sql<number>`COALESCE(SUM(${transactionsTable.amount}), 0)`,
        transactionCount: sql<number>`COUNT(${transactionsTable.id})`,
      })
      .from(eventsTable)
      .leftJoin(
        transactionsTable,
        eq(transactionsTable.event_id, eventsTable.id),
      )
      .where(eq(eventsTable.user_id, userId))
      .groupBy(eventsTable.id)
      .orderBy(desc(eventsTable.occurred_on))
  }

export const findEventTransactions =
  (db: DrizzleDatabase) =>
  async (eventId: EventId, userId: UserId): Promise<EventTransactionRow[]> => {
    return db
      .select({
        id: transactionsTable.id,
        transaction_date: transactionsTable.transaction_date,
        name: transactionsTable.name,
        amount: transactionsTable.amount,
        type: transactionsTable.type,
        category_name: categoriesTable.name,
        category_icon: categoriesTable.icon,
        category_color: categoriesTable.color,
      })
      .from(transactionsTable)
      .innerJoin(
        categoriesTable,
        eq(transactionsTable.category_id, categoriesTable.id),
      )
      .where(
        and(
          eq(transactionsTable.event_id, eventId),
          eq(transactionsTable.user_id, userId),
        ),
      )
      .orderBy(transactionsTable.transaction_date)
  }
