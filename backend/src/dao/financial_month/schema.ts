import { z } from 'zod'

import { FinancialYearValueSchema } from '@/domains/financial_year'
import type { MonthlyContext } from '@/domains/monthly_context'
import { MonthsSchema, WorkdayValueSchema } from '@/domains/monthly_context'
import { getPeriodByFinancialMonth } from '@/domains/monthly_context/logic'
import { EntityIdSchema, TimestampSchema } from '@/domains/schema'

export const FinancialMonthRecordSchema = z.object({
  id: EntityIdSchema('monthly_context'),
  user_id: EntityIdSchema('user'),
  financial_year: FinancialYearValueSchema,
  month: MonthsSchema,
  started_at: TimestampSchema,
  ended_at: TimestampSchema,
  workday: WorkdayValueSchema,
  standard_income_table_id: EntityIdSchema('standard_income_table'),
})
export type FinancialMonthRecord = z.infer<typeof FinancialMonthRecordSchema>

export const makeFinancialMonthRecord = (
  entity: MonthlyContext,
): FinancialMonthRecord => {
  const { start, end } = getPeriodByFinancialMonth({
    financialYear: entity.financialYear,
    month: entity.month,
  })

  return {
    id: entity.id,
    user_id: entity.userId,
    financial_year: entity.financialYear,
    month: entity.month,
    started_at: start.toTimestamp(),
    ended_at: end.toTimestamp(),
    workday: entity.workday,
    standard_income_table_id: entity.standardIncomeTable.id,
  }
}
