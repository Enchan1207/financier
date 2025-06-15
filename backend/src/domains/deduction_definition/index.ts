import type dayjs from '@/logic/dayjs'

export const DeductionDefinitionKind = [
  'absolute',
  'related_by_workday',
  'related_by_standard_income',
  'related_by_total_income',
] as const
export type DeductionDefinitionKind = (typeof DeductionDefinitionKind)[number]

/** 控除定義 */
export type DeductionDefinition = {
  id: string
  userId: string

  name: string
  kind: DeductionDefinitionKind
  value: number

  enabledAt: dayjs.Dayjs
  disabledAt: dayjs.Dayjs

  updatedAt: dayjs.Dayjs
}
