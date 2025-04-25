import { ulid } from 'ulid'

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
  // TODO: ここをFinancialMonthDataとかで管理したい
  enabledAt: dayjs.Dayjs
  disabledAt: dayjs.Dayjs
}): IncomeDefinition => {
  const {
    userId, kind, value, enabledAt, disabledAt,
  } = props

  return {
    id: ulid(),
    userId,
    kind,
    value,
    enabledAt,
    disabledAt,
    updatedAt: dayjs(),
  }
}
