import { z } from 'zod'

import { FinancialYearValueSchema } from '../financial_year'
import type { StandardIncomeTable } from '../standard_income'

export const WorkdayValueSchema = z.number().int().min(0).max(31).brand()
export type WorkdayValue = z.infer<typeof WorkdayValueSchema>

export const FinancialMonthValueSchema = z.number().int().min(1).max(12).brand()
export type Months = z.infer<typeof FinancialMonthValueSchema>

export const FinancialMonthInfoSchema = z.object({
  financialYear: FinancialYearValueSchema,
  month: FinancialMonthValueSchema,
})

/** 会計月度情報 */
export type FinancialMonthInfo = z.infer<typeof FinancialMonthInfoSchema>

/** 会計月度コンテキスト */
export type FinancialMonthContext = {
  id: string
  userId: string

  /** 会計月度情報 */
  info: FinancialMonthInfo

  /** 勤務日数 */
  workday: WorkdayValue

  /** 標準報酬月額テーブルのID */
  standardIncomeTableId: StandardIncomeTable['id']
}
