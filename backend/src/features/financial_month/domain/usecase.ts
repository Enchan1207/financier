import type { ResultAsync } from 'neverthrow'

import type { FinancialMonth } from '@/domains/financial_month'
import type { User } from '@/domains/user'
import type dayjs from '@/logic/dayjs'

// FIXME: ドメインモデル financial_year に移動する

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
