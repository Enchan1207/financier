import type { Brand } from '@backend/lib/brand'
import { ulid } from 'ulid'

import type { CategoryId } from './category'

export type EventTemplateId = Brand<string, 'event_template_id'>

export type TemplateTransaction = {
  categoryId: CategoryId
  amount: number
  name: string
}

export type EventTemplate = {
  id: EventTemplateId
  name: string
  defaultTransactions: TemplateTransaction[]
}

export const createEventTemplate = (
  props: Omit<EventTemplate, 'id'>,
): EventTemplate => ({
  id: ulid() as EventTemplateId,
  ...props,
})
