import dayjs from '@/logic/dayjs'

import type { FinancialMonthContext } from '../financial_month_context'
import type { IncomeDefinition } from '../income_definition'
import type { IncomeRecord, IncomeRecordUpdator } from '.'

export const createIncomeRecord = (props: {
  userId: string
  financialMonthId: FinancialMonthContext['id']
  definitionId: IncomeDefinition['id']
  value: number
  updatedBy: IncomeRecordUpdator
}): IncomeRecord => {
  const { userId, financialMonthId, definitionId, value, updatedBy } = props

  return {
    userId,
    financialMonthId,
    definitionId,
    value,
    updatedAt: dayjs(),
    updatedBy,
  }
}
