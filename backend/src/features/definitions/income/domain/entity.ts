import { ulid } from 'ulid'

import type { FinancialMonthData } from '@/features/financial_months/domain/valueObject'
import { getPeriodByFinancialMonth } from '@/features/financial_months/domain/valueObject'
import dayjs from '@/logic/dayjs'

export const IncomeDefinitionKind = ['absolute', 'related_by_workday'] as const
export type IncomeDefinitionKind = typeof IncomeDefinitionKind[number]

export type IncomeDefinition = {
  id: string
  userId: string

  kind: IncomeDefinitionKind
  value: number

  enabledAt: dayjs.Dayjs
  disabledAt: dayjs.Dayjs

  updatedAt: dayjs.Dayjs
}

export const createIncomeDefinition = (props: {
  userId: string
  kind: IncomeDefinitionKind
  value: number
  from: FinancialMonthData
  to: FinancialMonthData
}): IncomeDefinition => {
  const {
    userId, kind, value, from, to,
  } = props

  const { start } = getPeriodByFinancialMonth(from)
  const { end } = getPeriodByFinancialMonth(to)

  return {
    id: ulid(),
    userId,
    kind,
    value,
    enabledAt: start,
    disabledAt: end,
    updatedAt: dayjs(),
  }
}
