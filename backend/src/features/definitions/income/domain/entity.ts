import { ulid } from 'ulid'

import type { FinancialMonthData } from '@/features/financial_months/domains/valueObject'
import { getPeriodByFinancialMonth } from '@/features/financial_months/domains/valueObject'
import dayjs from '@/logic/dayjs'

export const IncomeDefinitionKind = ['absolute', 'related_by_workday'] as const
export type IncomeDefinitionKind = typeof IncomeDefinitionKind[number]

export type IncomeDefinition = {
  id: string
  userId: string

  name: string
  kind: IncomeDefinitionKind
  value: number
  isTaxable: boolean

  enabledAt: dayjs.Dayjs
  disabledAt: dayjs.Dayjs

  updatedAt: dayjs.Dayjs
}

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
