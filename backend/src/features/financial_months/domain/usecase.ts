import type { User } from '@/features/users/domain/entity'
import dayjs from '@/logic/dayjs'

import type { FinancialMonth } from './entity'
import { createFinancialMonth, Months } from './entity'
import type { FinancialMonthRepository } from './repository'

export interface FinancialMonthUsecase {
  /**
   * 与えられた会計年度に基づく会計月度エンティティを作成する
   * @param financialYear 作成対象の会計年度
   * @returns 作成されたエンティティの配列
   */
  initializeFinancialYear(user: User, financialYear: number):
  Promise<FinancialMonth[]>

  /**
   * 現在時刻に基づく会計月度エンティティを返す
   * @param now 現在時刻
   */
  getCurrentFinancialMonth(user: User, now?: dayjs.Dayjs):
  Promise<FinancialMonth | undefined>
}

const initializeFinancialYear = (repo: FinancialMonthRepository): FinancialMonthUsecase['initializeFinancialYear'] => (user, financialYear) => {
  const entities = Months.map(month => createFinancialMonth({
    userId: user.id,
    financialYear,
    month,
  }))

  return Promise.all(entities.map(entity => repo.insertFinancialMonth(entity)))
}

const getCurrentFinancialMonth = (repo: FinancialMonthRepository): FinancialMonthUsecase['getCurrentFinancialMonth'] => (user, now) => {
  return repo.findByDate(user.id, now ?? dayjs())
}

export const useFinancialMonthUsecase = (repo: FinancialMonthRepository): FinancialMonthUsecase => {
  return {
    initializeFinancialYear: initializeFinancialYear(repo),
    getCurrentFinancialMonth: getCurrentFinancialMonth(repo),
  }
}
