import type { Event, EventId } from '@backend/domains/event'
import type { UserId } from '@backend/domains/user'
import dayjs from '@backend/lib/date'
import type { eventsTable } from '@backend/schemas/events'
import type { InferSelectModel } from 'drizzle-orm'

type EventRecord = InferSelectModel<typeof eventsTable>

export const createEventModel = (record: EventRecord): Event => ({
  id: record.id as EventId,
  userId: record.user_id as UserId,
  name: record.name,
  occurredOn: dayjs(record.occurred_on),
})
