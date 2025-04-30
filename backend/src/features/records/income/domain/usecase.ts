import { ResultAsync } from 'neverthrow'

import type { IncomeDefinition } from '@/features/definitions/income/domain/entity'
import type { FinancialMonth } from '@/features/financial_months/domain/entity'
import type { User } from '@/features/users/domain/entity'

import type { IncomeRecord, IncomeRecordUpdator } from './entity'
import type { IncomeRecordRepository } from './repository'

export class IncomeRecordUsecaseError extends Error {}

export class NoSuchItemError extends IncomeRecordUsecaseError {
  constructor(key: {
    financialMonthId: FinancialMonth['id']
    definitionId: IncomeDefinition['id']
  }) {
    super(`会計月度 ${key.financialMonthId} には報酬定義 ${key.definitionId} に基づく実績がない`)
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
   * @param key 対象の会計月度および報酬定義
   */
  getIncomeRecord(user: User, key: {
    financialMonthId: FinancialMonth['id']
    definitionId: IncomeDefinition['id']
  }):
  ResultAsync<IncomeRecord, NoSuchItemError | AuthorizationError>

  /**
   * 報酬額を更新する
   * @param key 対象の会計月度および報酬定義
   * @param value 新しい値
   * @param updator 更新者
   */
  updateIncomeRecordValue(
    user: User,
    key: {
      financialMonthId: FinancialMonth['id']
      definitionId: IncomeDefinition['id']
    },
    value: number,
    updator: IncomeRecordUpdator
  ): ResultAsync<IncomeRecord, NoSuchItemError | AuthorizationError>
}

const getIncomeRecord = (repo: IncomeRecordRepository): IncomeRecordUsecase['getIncomeRecord'] =>
  ResultAsync.fromThrowable(async (user, key) => {
    const record = await repo.findBy(key)
    if (record === undefined) {
      throw new NoSuchItemError(key)
    }

    if (record.userId !== user.id) {
      throw new AuthorizationError(user, record)
    }

    return record
  })

const updateIncomeRecordValue = (repo: IncomeRecordRepository): IncomeRecordUsecase['updateIncomeRecordValue'] =>
  ResultAsync.fromThrowable(async (user, key, value) => {
    const stored = await repo.findBy(key)
    if (stored === undefined) {
      throw new NoSuchItemError(key)
    }

    if (stored.userId !== user.id) {
      throw new AuthorizationError(user, stored)
    }

    const updated = await repo.updateIncomeRecordValue(key, value)
    if (updated === undefined) {
      throw new NoSuchItemError(key)
    }

    return updated
  })

export const useIncomeRecordUsecase = (repo: IncomeRecordRepository): IncomeRecordUsecase => {
  return {
    getIncomeRecord: getIncomeRecord(repo),
    updateIncomeRecordValue: updateIncomeRecordValue(repo),
  }
}
