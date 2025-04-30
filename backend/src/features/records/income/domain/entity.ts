import type { IncomeDefinition } from '@/features/definitions/income/domain/entity'
import type { FinancialMonth } from '@/features/financial_months/domain/entity'
import dayjs from '@/logic/dayjs'

export const IncomeRecordUpdator = ['user', 'system'] as const
export type IncomeRecordUpdator = typeof IncomeRecordUpdator[number]

/** 報酬実績 */
export type IncomeRecord = {
  userId: string

  financialMonthId: FinancialMonth['id']
  definitionId: IncomeDefinition['id']

  value: number

  updatedAt: dayjs.Dayjs
  updatedBy: IncomeRecordUpdator
}

export const createIncomeRecord = (props: {
  userId: string
  financialMonthId: FinancialMonth['id']
  definitionId: IncomeDefinition['id']
  value: number
  updatedBy: IncomeRecordUpdator
}): IncomeRecord => {
  const {
    userId, financialMonthId, definitionId, value, updatedBy,
  } = props

  return {
    userId,
    financialMonthId,
    definitionId,
    value,
    updatedAt: dayjs(),
    updatedBy,
  }
}
