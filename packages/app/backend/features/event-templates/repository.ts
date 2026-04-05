import type { Event } from '@backend/domains/event'
import type {
  EventTemplate,
  EventTemplateId,
  TemplateTransaction,
} from '@backend/domains/event-template'
import type { Transaction } from '@backend/domains/transaction'
import type { UserId } from '@backend/domains/user'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { eventTemplatesTable } from '@backend/schemas/event-templates'
import { eventsTable } from '@backend/schemas/events'
import { transactionsTable } from '@backend/schemas/transactions'
import { and, eq } from 'drizzle-orm'

const toEventTemplate = (row: {
  id: string
  user_id: string
  name: string
  default_transactions: string
}): EventTemplate => ({
  id: row.id as EventTemplateId,
  userId: row.user_id as UserId,
  name: row.name,
  defaultTransactions: JSON.parse(
    row.default_transactions,
  ) as TemplateTransaction[],
})

export const findEventTemplates =
  (db: DrizzleDatabase) =>
  async (userId: UserId): Promise<EventTemplate[]> => {
    const results = await db
      .select()
      .from(eventTemplatesTable)
      .where(eq(eventTemplatesTable.user_id, userId))
    return results.map(toEventTemplate)
  }

export const findEventTemplateById =
  (db: DrizzleDatabase) =>
  async (
    id: EventTemplateId,
    userId: UserId,
  ): Promise<EventTemplate | undefined> => {
    const results = await db
      .select()
      .from(eventTemplatesTable)
      .where(
        and(
          eq(eventTemplatesTable.id, id),
          eq(eventTemplatesTable.user_id, userId),
        ),
      )
    const row = results[0]
    return row ? toEventTemplate(row) : undefined
  }

export const saveEventTemplate =
  (db: DrizzleDatabase) =>
  async (template: EventTemplate): Promise<void> => {
    await db
      .insert(eventTemplatesTable)
      .values({
        id: template.id,
        user_id: template.userId,
        name: template.name,
        default_transactions: JSON.stringify(template.defaultTransactions),
      })
      .onConflictDoUpdate({
        target: eventTemplatesTable.id,
        set: {
          name: template.name,
          default_transactions: JSON.stringify(template.defaultTransactions),
        },
      })
  }

export const deleteEventTemplate =
  (db: DrizzleDatabase) =>
  async (id: EventTemplateId): Promise<void> => {
    await db.delete(eventTemplatesTable).where(eq(eventTemplatesTable.id, id))
  }

export const saveEventWithTransactions =
  (db: DrizzleDatabase) =>
  async (event: Event, transactions: Transaction[]): Promise<void> => {
    await db.batch([
      db.insert(eventsTable).values({
        id: event.id,
        user_id: event.userId,
        name: event.name,
        occurred_on: event.occurredOn.format('YYYY-MM-DD'),
      }),
      ...transactions.map((t) =>
        db.insert(transactionsTable).values({
          id: t.id,
          user_id: t.userId,
          type: t.type,
          amount: t.amount,
          category_id: t.categoryId,
          event_id: t.eventId,
          name: t.name,
          transaction_date: t.transactionDate.format('YYYY-MM-DD'),
          created_at: t.createdAt.toISOString(),
        }),
      ),
    ])
  }
