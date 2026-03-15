import type { Brand } from '@backend/lib/brand'
import type { Dayjs } from '@backend/lib/date'
import dayjs from '@backend/lib/date'
import { ulid } from 'ulid'

import type { CategoryId } from './category'

export type SavingDefinitionId = Brand<string, 'saving_definition_id'>
export type SavingWithdrawalId = Brand<string, 'saving_withdrawal_id'>

type SavingDefinitionBase = {
  id: SavingDefinitionId
  categoryId: CategoryId
}

export type GoalSavingDefinition = SavingDefinitionBase & {
  type: 'goal'
  targetAmount: number
  deadline: Dayjs | null
}

export type FreeSavingDefinition = SavingDefinitionBase & {
  type: 'free'
}

export type SavingDefinition = GoalSavingDefinition | FreeSavingDefinition

export type SavingWithdrawal = {
  id: SavingWithdrawalId
  savingDefinitionId: SavingDefinitionId
  amount: number
  withdrawalDate: Dayjs
  memo: string | null
  createdAt: Dayjs
}

export const createGoalSavingDefinition = (
  props: Omit<GoalSavingDefinition, 'id' | 'type'>,
): GoalSavingDefinition => ({
  id: ulid() as SavingDefinitionId,
  type: 'goal',
  ...props,
})

export const createFreeSavingDefinition = (
  props: Omit<FreeSavingDefinition, 'id' | 'type'>,
): FreeSavingDefinition => ({
  id: ulid() as SavingDefinitionId,
  type: 'free',
  ...props,
})

export const createSavingWithdrawal = (
  props: Omit<SavingWithdrawal, 'id' | 'createdAt'>,
): SavingWithdrawal => ({
  id: ulid() as SavingWithdrawalId,
  createdAt: dayjs(),
  ...props,
})
