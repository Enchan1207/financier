import { ResultAsync } from 'neverthrow'

import type { User } from '@/features/users/domains/entity'
import dayjs from '@/logic/dayjs'

import type { FinancialMonth } from './entity'
import { createFinancialMonth } from './entity'
import type { FinancialMonthRepository } from './repository'
import { Months } from './valueObject'

export interface FinancialMonthUsecase {
  /**
   * 与えられた会計年度に基づく会計月度エンティティを作成する
   * @param financialYear 作成対象の会計年度
   * @returns 作成されたエンティティの配列
   */
  initializeFinancialYear(user: User, financialYear: number):
  ResultAsync<FinancialMonth[], Error>

  /**
   * 現在時刻に基づく会計月度エンティティを返す
   * @param now 現在時刻
   */
  getCurrentFinancialMonth(user: User, now?: dayjs.Dayjs):
  ResultAsync<FinancialMonth, Error>
}

class FinancialMonthUsecaseError extends Error {}

const initializeFinancialYear = (repo: FinancialMonthRepository): FinancialMonthUsecase['initializeFinancialYear'] =>
  ResultAsync.fromThrowable((user, financialYear) => {
    const entities = Months.map(month => createFinancialMonth({
      userId: user.id,
      financialYear,
      month,
    }))

    return Promise.all(entities.map(entity => repo.insertFinancialMonth(entity)))
  })

const getCurrentFinancialMonth = (repo: FinancialMonthRepository): FinancialMonthUsecase['getCurrentFinancialMonth'] =>
  ResultAsync.fromThrowable(async (user, now) => {
    const record = await repo.findByDate(user.id, now ?? dayjs())
    if (record === undefined) {
      throw new FinancialMonthUsecaseError('該当する会計月度は登録されていない')
    }

    return record
  }, e => e instanceof FinancialMonthUsecaseError ? e : new Error('unexpected error'))

export const useFinancialMonthUsecase = (repo: FinancialMonthRepository): FinancialMonthUsecase => {
  return {
    initializeFinancialYear: initializeFinancialYear(repo),
    getCurrentFinancialMonth: getCurrentFinancialMonth(repo),
  }
}
