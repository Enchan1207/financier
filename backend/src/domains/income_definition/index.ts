import type dayjs from '@/logic/dayjs'

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
