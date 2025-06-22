import { z } from 'zod'

import type { Actual } from '@/domains/actual'
import type { MonthlyContext } from '@/domains/monthly_context'
import { EntityIdSchema, MoneySchema } from '@/domains/schema'

import type { MonthlyContextRecord } from '../monthly_context/schema'

export const ActualRecordSchema = z.object({
  id: EntityIdSchema('actual'),
  user_id: EntityIdSchema('user'),
  definition_id: EntityIdSchema('definition'),
  monthly_context_id: EntityIdSchema('monthly_context'),
  value: MoneySchema,
})
export type ActualRecord = z.infer<typeof ActualRecordSchema>

export const makeActualEntity = (
  actual: ActualRecord,
  context: MonthlyContextRecord,
): Actual => ({
  id: actual.id,
  userId: actual.user_id,
  definitionId: actual.definition_id,
  financialYear: context.financial_year,
  month: context.month,
  value: actual.value,
})

export const makeActualRecord = (
  actual: Actual,
  context: MonthlyContext,
): ActualRecord => ({
  id: actual.id,
  user_id: actual.userId,
  definition_id: actual.definitionId,
  monthly_context_id: context.id,
  value: actual.value,
})
