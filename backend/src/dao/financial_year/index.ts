import type {
  FinancialYear,
  FinancialYearValue,
} from '@/domains/financial_year'
import type { User } from '@/domains/user'

export interface FinancialYearDao {
  /** 会計年度を挿入する */
  insertFinancialYear(item: FinancialYear): Promise<FinancialYear>

  /** 会計年度一覧を取得する */
  listFinancialYears(props: {
    userId: User['id']
    order?: 'asc' | 'desc'
  }): Promise<FinancialYearValue[]>

  /** 年から会計年度を取得する */
  getFinancialYear(props: {
    userId: User['id']
    financialYear: FinancialYearValue
  }): Promise<FinancialYear | undefined>
}
