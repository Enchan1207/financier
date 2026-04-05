import type { Event } from '@backend/domains/event'
import type {
  EventTemplate,
  EventTemplateId,
  TemplateTransaction,
} from '@backend/domains/event-template'
import type { Transaction } from '@backend/domains/transaction'
import type { UserId } from '@backend/domains/user'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import {
  eventTemplateItemsTable,
  eventTemplatesTable,
} from '@backend/schemas/event-templates'
import { eventsTable } from '@backend/schemas/events'
import { transactionsTable } from '@backend/schemas/transactions'
import { and, eq } from 'drizzle-orm'

const groupEventTemplates = (
  rows: Array<{
    id: string
    user_id: string
    name: string
    item_event_template_id: string | null
    item_category_id: string | null
    item_name: string | null
    item_amount: number | null
  }>,
): EventTemplate[] => {
  const map = new Map<
    string,
    { id: string; user_id: string; name: string; items: TemplateTransaction[] }
  >()
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        items: [],
      })
    }
    if (
      row.item_category_id !== null &&
      row.item_name !== null &&
      row.item_amount !== null
    ) {
      const entry = map.get(row.id)
      if (entry) {
        entry.items.push({
          categoryId:
            row.item_category_id as EventTemplate['defaultTransactions'][number]['categoryId'],
          name: row.item_name,
          amount: row.item_amount,
        })
      }
    }
  }
  return [...map.values()].map((entry) => ({
    id: entry.id as EventTemplateId,
    userId: entry.user_id as UserId,
    name: entry.name,
    defaultTransactions: entry.items,
  }))
}

export const findEventTemplates =
  (db: DrizzleDatabase) =>
  async (userId: UserId): Promise<EventTemplate[]> => {
    const rows = await db
      .select({
        id: eventTemplatesTable.id,
        user_id: eventTemplatesTable.user_id,
        name: eventTemplatesTable.name,
        item_event_template_id: eventTemplateItemsTable.event_template_id,
        item_category_id: eventTemplateItemsTable.category_id,
        item_name: eventTemplateItemsTable.name,
        item_amount: eventTemplateItemsTable.amount,
      })
      .from(eventTemplatesTable)
      .leftJoin(
        eventTemplateItemsTable,
        eq(eventTemplatesTable.id, eventTemplateItemsTable.event_template_id),
      )
      .where(eq(eventTemplatesTable.user_id, userId))
    return groupEventTemplates(rows)
  }

export const findEventTemplateById =
  (db: DrizzleDatabase) =>
  async (
    id: EventTemplateId,
    userId: UserId,
  ): Promise<EventTemplate | undefined> => {
    const rows = await db
      .select({
        id: eventTemplatesTable.id,
        user_id: eventTemplatesTable.user_id,
        name: eventTemplatesTable.name,
        item_event_template_id: eventTemplateItemsTable.event_template_id,
        item_category_id: eventTemplateItemsTable.category_id,
        item_name: eventTemplateItemsTable.name,
        item_amount: eventTemplateItemsTable.amount,
      })
      .from(eventTemplatesTable)
      .leftJoin(
        eventTemplateItemsTable,
        eq(eventTemplatesTable.id, eventTemplateItemsTable.event_template_id),
      )
      .where(
        and(
          eq(eventTemplatesTable.id, id),
          eq(eventTemplatesTable.user_id, userId),
        ),
      )
    return groupEventTemplates(rows)[0]
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
      })
      .onConflictDoUpdate({
        target: eventTemplatesTable.id,
        set: { name: template.name },
      })
    await db
      .delete(eventTemplateItemsTable)
      .where(eq(eventTemplateItemsTable.event_template_id, template.id))
    if (template.defaultTransactions.length > 0) {
      await db.insert(eventTemplateItemsTable).values(
        template.defaultTransactions.map((tx) => ({
          event_template_id: template.id,
          category_id: tx.categoryId,
          name: tx.name,
          amount: tx.amount,
        })),
      )
    }
  }

export const deleteEventTemplate =
  (db: DrizzleDatabase) =>
  async (id: EventTemplateId): Promise<void> => {
    await db
      .delete(eventTemplateItemsTable)
      .where(eq(eventTemplateItemsTable.event_template_id, id))
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
