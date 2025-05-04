import { z } from 'zod'

export const Months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
export type Months = typeof Months[number]

export const FinancialMonthDataSchema = z.object({
  financialYear: z.number().int().min(0),
  month: z.number().int().min(1).max(12),
})

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
