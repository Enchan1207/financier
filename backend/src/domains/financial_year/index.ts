import type { FinancialMonth } from '../financial_month'

/** 会計年度 */
export interface FinancialYear {
  year: number
  months: FinancialMonth[]
}
