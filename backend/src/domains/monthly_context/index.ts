import { z } from 'zod'

import { UlidSchema } from '@/dao/schema'

import { FinancialYearValueSchema } from '../financial_year'

export const WorkdayValueSchema = z.number().int().min(0).max(31).brand()
export type WorkdayValue = z.infer<typeof WorkdayValueSchema>

export const MonthsSchema = z.number().int().min(1).max(12).brand()
export type Months = z.infer<typeof MonthsSchema>

export const Months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

export const FinancialMonthInfoSchema = z.object({
  financialYear: FinancialYearValueSchema,
  month: MonthsSchema,
})

/** 会計月度情報 */
export type FinancialMonthInfo = z.infer<typeof FinancialMonthInfoSchema>

export const MonthlyContextSchema = z
  .object({
    id: UlidSchema,
    userId: UlidSchema,
    workday: WorkdayValueSchema,
    standardIncomeTableId: UlidSchema,
  })
  .merge(FinancialMonthInfoSchema)

/** 会計月度コンテキスト */
export type MonthlyContext = z.infer<typeof MonthlyContextSchema>
