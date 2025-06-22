import { z } from 'zod'

import type { Actual } from '@/domains/actual'
import type { Definition } from '@/domains/definition'
import type { MonthlyContext } from '@/domains/monthly_context'
import { MonthsSchema, WorkdayValueSchema } from '@/domains/monthly_context'
import { EntityIdSchema } from '@/domains/schema'

export const MonthlyContextRecordSchema = z.object({
  id: EntityIdSchema('monthly_context'),
  user_id: EntityIdSchema('user'),
  financial_year_id: EntityIdSchema('financial_year'),
  month: MonthsSchema,
  workday: WorkdayValueSchema,
})
export type MonthlyContextRecord = z.infer<typeof MonthlyContextRecordSchema>

export const makeMonthlyContextRecord = (
  entity: MonthlyContext,
): MonthlyContextRecord => ({
  id: entity.id,
  user_id: entity.userId,
  financial_year_id: entity.financialYearId,
  month: entity.month,
  workday: entity.workday,
})

export const makeMonthlyContextEntity = (
  record: MonthlyContextRecord,
  definitions: Definition[],
  actuals: Actual[],
): MonthlyContext => ({
  id: record.id,
  month: record.month,
  workday: record.workday,
  financialYearId: record.financial_year_id,
  userId: record.user_id,
  definitions,
  actuals,
})
