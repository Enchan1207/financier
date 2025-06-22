import { z } from 'zod'

import type { Actual } from '@/domains/actual'
import type { Definition } from '@/domains/definition'
import { FinancialYearValueSchema } from '@/domains/financial_year'
import type { MonthlyContext } from '@/domains/monthly_context'
import { MonthsSchema, WorkdayValueSchema } from '@/domains/monthly_context'
import { EntityIdSchema } from '@/domains/schema'
import type { StandardIncomeTable } from '@/domains/standard_income'

export const MonthlyContextRecordSchema = z.object({
  id: EntityIdSchema('monthly_context'),
  user_id: EntityIdSchema('user'),
  financial_year: FinancialYearValueSchema,
  month: MonthsSchema,
  workday: WorkdayValueSchema,
  standard_income_table_id: EntityIdSchema('standard_income_table'),
})
export type MonthlyContextRecord = z.infer<typeof MonthlyContextRecordSchema>

export const makeMonthlyContextRecord = (
  entity: MonthlyContext,
): MonthlyContextRecord => ({
  id: entity.id,
  user_id: entity.userId,
  financial_year: entity.financialYear,
  month: entity.month,
  workday: entity.workday,
  standard_income_table_id: entity.standardIncomeTable.id,
})

export const makeMonthlyContextEntity = (
  record: MonthlyContextRecord,
  definitions: Definition[],
  actuals: Actual[],
  standardIncomeTable: StandardIncomeTable,
): MonthlyContext => ({
  id: record.id,
  month: record.month,
  workday: record.workday,
  userId: record.user_id,
  definitions,
  actuals,
  financialYear: record.financial_year,
  standardIncomeTable,
})
