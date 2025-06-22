import { z } from 'zod'

import { MonthsSchema } from '../monthly_context'
import { EntityIdSchema } from '../schema'
import { StandardIncomeTableSchema } from '../standard_income'

export const FinancialYearValueSchema = z
  .number()
  .int()
  .min(2000)
  .max(2099)
  .brand()

export type FinancialYearValue = z.infer<typeof FinancialYearValueSchema>

export const FinancialYearSchema = z.object({
  id: EntityIdSchema('financial_year'),
  userId: EntityIdSchema('user'),
  year: FinancialYearValueSchema,
  months: z
    .array(
      z.object({
        id: EntityIdSchema('monthly_context'),
        month: MonthsSchema,
      }),
    )
    .length(12),
  standardIncomeTable: StandardIncomeTableSchema,
})

/** 会計年度 */
export type FinancialYear = z.infer<typeof FinancialYearSchema>
