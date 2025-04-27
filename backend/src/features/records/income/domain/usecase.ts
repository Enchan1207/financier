import { ResultAsync } from 'neverthrow'

import type { User } from '@/features/users/domain/entity'

import type { IncomeRecord, IncomeRecordUpdator } from './entity'
import type { IncomeRecordRepository } from './repository'

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

const getIncomeRecord = (repo: IncomeRecordRepository): IncomeRecordUsecase['getIncomeRecord'] =>
  ResultAsync.fromThrowable(async (user, id) => {
    const record = await repo.findById(id)
    if (record === undefined) {
      throw new NoSuchItemError(id)
    }

    if (record.userId !== user.id) {
      throw new AuthorizationError(user, record)
    }

    return record
  })

const updateIncomeRecordValue = (repo: IncomeRecordRepository): IncomeRecordUsecase['updateIncomeRecordValue'] =>
  ResultAsync.fromThrowable(async (user, id, value) => {
    const stored = await repo.findById(id)
    if (stored === undefined) {
      throw new NoSuchItemError(id)
    }

    if (stored.userId !== user.id) {
      throw new AuthorizationError(user, stored)
    }

    const updated = await repo.updateIncomeDefinition(id, { value })
    if (updated === undefined) {
      throw new NoSuchItemError(id)
    }

    return updated
  })

export const useIncomeRecordUsecase = (repo: IncomeRecordRepository): IncomeRecordUsecase => {
  return {
    getIncomeRecord: getIncomeRecord(repo),
    updateIncomeRecordValue: updateIncomeRecordValue(repo),
  }
}
