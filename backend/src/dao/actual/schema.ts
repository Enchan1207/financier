import { z } from 'zod'

import type { Actual } from '@/domains/actual'
import { EntityIdSchema, MoneySchema, TimestampSchema } from '@/domains/schema'

export const ActualRecordSchema = z.object({
  user_id: EntityIdSchema('user'),
  monthly_context_id: EntityIdSchema('monthly_context'),
  definition_id: EntityIdSchema('definition'),
  value: MoneySchema,
  updated_at: TimestampSchema,
})
export type ActualRecord = z.infer<typeof ActualRecordSchema>

export const makeActualEntity = (actual: ActualRecord): Actual => ({
  userId: actual.user_id,
  monthlyContextId: actual.monthly_context_id,
  definitionId: actual.definition_id,
  value: actual.value,
  updatedAt: actual.updated_at,
})

export const makeActualRecord = (actual: Actual): ActualRecord => ({
  user_id: actual.userId,
  definition_id: actual.definitionId,
  monthly_context_id: actual.monthlyContextId,
  value: actual.value,
  updated_at: actual.updatedAt,
})
