import type { User } from '../user'

// MARK: base

type Base = {
  id: string

  userId: User['id']

  /** 定義名 */
  name: string

  /** 定義値 */
  value: number

  enabledAt: number
  disabledAt: number
  updatedAt: number
}

export const DefinitionType = ['income', 'deduction'] as const
export type DefinitionType = (typeof DefinitionType)[number]

// MARK: income

export const IncomeDefinitionKind = [
  'absolute',
  'related_by_workday',
  'absolute_taxable',
  'related_by_workday_taxable',
] as const
export type IncomeDefinitionKind = (typeof IncomeDefinitionKind)[number]

type Income = {
  type: 'income'
  kind: IncomeDefinitionKind
}

// MARK: deduction

export const DeductionDefinitionKind = [
  'absolute',
  'related_by_workday',
  'related_by_standard_income',
  'related_by_total_income',
] as const
export type DeductionDefinitionKind = (typeof DeductionDefinitionKind)[number]

type Deduction = {
  type: 'deduction'
  kind: DeductionDefinitionKind
}

/** 定義 */
export type Definition = Base & (Income | Deduction)
