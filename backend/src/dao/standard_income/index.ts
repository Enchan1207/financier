import type {
  StandardIncomeGrade,
  StandardIncomeTable,
  StandardIncomeTableSummary,
} from '@/domains/standard_income'
import type { User } from '@/domains/user'

export interface StandardIncomeDao {
  /** IDを指定して標準報酬月額表を取得する */
  getStandardIncomeTableById(props: {
    userId: User['id']
    id: StandardIncomeTable['id']
  }): Promise<StandardIncomeTable | undefined>

  /** 新しい標準報酬月額表を挿入する */
  insertStandardIncomeTable(
    item: StandardIncomeTable,
  ): Promise<StandardIncomeTable>

  /** 標準報酬月額表の一覧を取得する */
  listStandardIncomeTables(props: {
    userId: User['id']
    order?: 'asc' | 'desc'
  }): Promise<StandardIncomeTableSummary[]>

  /** 標準報酬月額表の階級を変更する */
  updateStandardIncomeTableGrades(props: {
    userId: User['id']
    id: StandardIncomeTable['id']
    grades: StandardIncomeGrade[]
  }): Promise<StandardIncomeTableSummary | undefined>

  /** 標準報酬月額表の名前を変更する */
  updateStandardIncomeTableName(props: {
    userId: User['id']
    id: StandardIncomeTable['id']
    name: StandardIncomeTable['name']
  }): Promise<StandardIncomeTableSummary | undefined>
}
