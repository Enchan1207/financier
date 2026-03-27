import type { Event, EventId } from '@backend/domains/event'
import type { UserId } from '@backend/domains/user'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { createEventModel } from '@backend/repositories/event'
import { eventsTable } from '@backend/schemas/events'
import { transactionsTable } from '@backend/schemas/transactions'
import { and, eq } from 'drizzle-orm'

export const findEvents =
  (db: DrizzleDatabase) =>
  async (userId: UserId): Promise<Event[]> => {
    const results = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.user_id, userId))
    return results.map(createEventModel)
  }

export const findEventById =
  (db: DrizzleDatabase) =>
  async (id: EventId, userId: UserId): Promise<Event | undefined> => {
    const results = await db
      .select()
      .from(eventsTable)
      .where(and(eq(eventsTable.id, id), eq(eventsTable.user_id, userId)))

    const row = results[0]
    return row ? createEventModel(row) : undefined
  }

export const findTransactionCountByEventId =
  (db: DrizzleDatabase) =>
  async (eventId: EventId, userId: UserId): Promise<number> => {
    const results = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.event_id, eventId),
          eq(transactionsTable.user_id, userId),
        ),
      )
    return results.length
  }

export const saveEvent =
  (db: DrizzleDatabase) =>
  async (event: Event): Promise<void> => {
    await db
      .insert(eventsTable)
      .values({
        id: event.id,
        user_id: event.userId,
        name: event.name,
        occurred_on: event.occurredOn.format('YYYY-MM-DD'),
      })
      .onConflictDoUpdate({
        target: eventsTable.id,
        set: {
          name: event.name,
          occurred_on: event.occurredOn.format('YYYY-MM-DD'),
        },
      })
  }

export const deleteEvent =
  (db: DrizzleDatabase) =>
  async (id: EventId): Promise<void> => {
    await db.delete(eventsTable).where(eq(eventsTable.id, id))
  }
