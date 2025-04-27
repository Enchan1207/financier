import type { ResultAsync } from 'neverthrow'

import type { User } from '@/features/users/domain/entity'

import type { IncomeRecord, IncomeRecordUpdator } from './entity'

export class IncomeRecordUsecaseError extends Error {}

export class NoSuchItemError extends IncomeRecordUsecaseError {
  constructor(id: IncomeRecord['id']) {
    super(`与えられたIDに合致するアイテムが見つからない: ${id}`)
  }
}

export class AuthorizationError extends IncomeRecordUsecaseError {
  constructor(user: User, item: IncomeRecord) {
    super(`ユーザIDが一致しない: ${user.id}, ${item.userId}`)
  }
}

export interface IncomeRecordUsecase {
  /**
   * 報酬実績を取得する
   * @param id
   */
  getIncomeRecord(user: User, id: IncomeRecord['id']):
  ResultAsync<IncomeRecord, NoSuchItemError | AuthorizationError>

  /**
   * 報酬額を更新する
   * @param id
   * @param value 新しい値
   * @param updator 更新者
   */
  updateIncomeRecordValue(
    user: User,
    id: IncomeRecord['id'],
    value: number,
    updator: IncomeRecordUpdator
  ): ResultAsync<IncomeRecord, NoSuchItemError | AuthorizationError>
}
