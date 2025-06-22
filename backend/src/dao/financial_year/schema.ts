import { z } from 'zod'

import type { FinancialYear } from '@/domains/financial_year'
import { FinancialYearValueSchema } from '@/domains/financial_year'
import { EntityIdSchema } from '@/domains/schema'

export const FinancialYearRecordSchema = z.object({
  id: EntityIdSchema('financial_year'),
  user_id: EntityIdSchema('user'),
  year: FinancialYearValueSchema,
  standard_income_table_id: EntityIdSchema('standard_income_table'),
})
export type FinancialYearRecord = z.infer<typeof FinancialYearRecordSchema>

export const makeFinancialYearRecord = (
  entity: FinancialYear,
): FinancialYearRecord => ({
  id: entity.id,
  user_id: entity.userId,
  year: entity.year,
  standard_income_table_id: entity.standardIncomeTable.id,
})
