export const Months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
export type Months = typeof Months[number]

/** 会計月度 */
export type FinancialMonthData = {
  financialYear: number
  month: Months
}

/** 会計月度エンティティ */
export type FinancialMonth = FinancialMonthData & {
  id: string
  userId: string
}
