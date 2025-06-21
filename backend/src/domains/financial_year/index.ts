import { z } from 'zod'

import type { MonthlyContext } from '../monthly_context'

export const FinancialYearValueSchema = z
  .number()
  .int()
  .min(2000)
  .max(2099)
  .brand()

export type FinancialYearValue = z.infer<typeof FinancialYearValueSchema>

/** 会計年度 */
export interface FinancialYear {
  year: FinancialYearValue
  months: MonthlyContext[]
}
