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
