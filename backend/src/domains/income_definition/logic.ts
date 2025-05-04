import { ulid } from 'ulid'

import dayjs from '@/logic/dayjs'

import type { FinancialMonthData } from '../financial_month'
import { getPeriodByFinancialMonth } from '../financial_month/logic'
import type { IncomeDefinition, IncomeDefinitionKind } from '.'

// TODO: from > to ならドメインエラーにすべきでは?
export const createIncomeDefinition = (props: {
  userId: string
  name: string
  kind: IncomeDefinitionKind
  isTaxable: boolean
  value: number
  from: FinancialMonthData
  to: FinancialMonthData
}): IncomeDefinition => {
  const {
    userId, name, kind, value, isTaxable, from, to,
  } = props

  const { start } = getPeriodByFinancialMonth(from)
  const { end } = getPeriodByFinancialMonth(to)

  return {
    id: ulid(),
    userId,
    name,
    kind,
    value,
    isTaxable,
    enabledAt: start,
    disabledAt: end,
    updatedAt: dayjs(),
  }
}
