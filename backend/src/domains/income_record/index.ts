import { z } from 'zod'

import type dayjs from '@/logic/dayjs'

import type { FinancialMonthContext } from '../financial_month_context'
import type { IncomeDefinition } from '../income_definition'

export const IncomeRecordUpdator = ['user', 'system'] as const
export type IncomeRecordUpdator = (typeof IncomeRecordUpdator)[number]

/** 報酬実績 */
export type IncomeRecord = {
  userId: string

  financialMonthId: FinancialMonthContext['id']
  definitionId: IncomeDefinition['id']

  value: number

  updatedAt: dayjs.Dayjs
  updatedBy: IncomeRecordUpdator
}

export const IncomeRecordItemSchema = z.object({
  userId: z.string(),
  name: z.string(),
  value: z.number(),
})

/** 報酬実績アイテム */
export type IncomeRecordItem = z.infer<typeof IncomeRecordItemSchema>
