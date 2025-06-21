import { z } from 'zod'

import type { Actual } from '@/domains/actual'

import { UlidSchema } from '../schema'

export const ActualRecordSchema = z.object({
  id: UlidSchema,
  user_id: UlidSchema,
  definition_id: UlidSchema,
  financial_month_id: UlidSchema,
  value: z.number().int().min(0),
})
export type ActualRecord = z.infer<typeof ActualRecordSchema>

export const makeActualEntity = (record: ActualRecord): Actual => ({
  id: record.id,
  userId: record.user_id,
  definitionId: record.definition_id,
  financialMonthId: record.financial_month_id,
  value: record.value,
})

export const makeActualRecord = (entity: Actual): ActualRecord => ({
  id: entity.id,
  user_id: entity.userId,
  definition_id: entity.definitionId,
  financial_month_id: entity.financialMonthId,
  value: entity.value,
})
