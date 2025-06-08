import dayjs from '@/logic/dayjs'

import type { FinancialMonth } from '../financial_month'
import type { IncomeDefinition } from '../income_definition'
import type { IncomeRecord, IncomeRecordUpdator } from '.'

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
