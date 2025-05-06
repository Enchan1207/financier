import { z } from 'zod'

import { FinancialYearValueSchema } from '../financial_year'

export const FinancialMonthValueSchema = z
  .number()
  .int()
  .min(1)
  .max(12)
  .brand()
export type Months = z.infer<typeof FinancialMonthValueSchema>

export const Months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

export const FinancialMonthDataSchema = z.object({
  financialYear: FinancialYearValueSchema,
  month: FinancialMonthValueSchema,
})

/** 会計月度 */
export type FinancialMonthData = z.infer<typeof FinancialMonthDataSchema>

/** 会計月度エンティティ */
export type FinancialMonth = FinancialMonthData & {
  id: string
  userId: string
}
