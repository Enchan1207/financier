import type { Brand } from '@backend/lib/brand'
import type { Dayjs } from '@backend/lib/date'
import dayjs from '@backend/lib/date'
import { ulid } from 'ulid'

import type { CategoryId } from './category'

export type SavingDefinitionId = Brand<string, 'saving_definition_id'>
export type SavingWithdrawalId = Brand<string, 'saving_withdrawal_id'>

type SavingDefinitionBase = {
  id: SavingDefinitionId
  /** 紐づく積立カテゴリ（1定義につき1カテゴリ） */
  categoryId: CategoryId
}

export type GoalSavingDefinition = SavingDefinitionBase & {
  type: 'goal'
  /** 目標額（日本円） */
  targetAmount: number
  /** 積立期限。null の場合は期限なし（期限設定時のみ月次目安額を表示する） */
  deadline: Dayjs | null
}

export type FreeSavingDefinition = SavingDefinitionBase & {
  type: 'free'
}

export type SavingDefinition = GoalSavingDefinition | FreeSavingDefinition

export type SavingWithdrawal = {
  id: SavingWithdrawalId
  /** 紐づく積立定義 */
  savingDefinitionId: SavingDefinitionId
  /** 取り崩し額（日本円） */
  amount: number
  /** 取り崩し日。取り崩し実行時のサーバ日付を自動設定する */
  withdrawalDate: Dayjs
  /** メモ（任意） */
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
