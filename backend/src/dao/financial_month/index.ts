import type {
  FinancialMonthInfo,
  MonthlyContext,
  WorkdayValue,
} from '@/domains/monthly_context'
import type { User } from '@/domains/user'
import type dayjs from '@/logic/dayjs'

export interface FinancialMonthDao {
  /**
   * 月度からコンテキストを取得
   * @deprecated
   */
  getMonthlyContext(props: {
    userId: User['id']
    info: FinancialMonthInfo
  }): Promise<MonthlyContext | undefined>

  /**
   * 日付からコンテキストを検索
   * @deprecated
   */
  findFinancialMonthCotextsByDate(props: {
    userId: User['id']
    date: dayjs.Dayjs
  }): Promise<MonthlyContext | undefined>

  /**
   * 月度コンテキストを更新
   * @deprecated
   */
  updateMonthlyContext(props: {
    id: MonthlyContext['id']
    userId: User['id']
    workday: WorkdayValue
  }): Promise<MonthlyContext | undefined>
}
