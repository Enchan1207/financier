import type { Brand } from '@backend/lib/brand'
import type { Dayjs } from '@backend/lib/date'
import { ulid } from 'ulid'

export type EventId = Brand<string, 'event_id'>

export type Event = {
  id: EventId
  name: string
  occurredOn: Dayjs
}

export const createEvent = (props: Omit<Event, 'id'>): Event => ({
  id: ulid() as EventId,
  ...props,
})
