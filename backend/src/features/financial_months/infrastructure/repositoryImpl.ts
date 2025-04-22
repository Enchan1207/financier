import type { FinancialMonth, Months } from '../domain/entity'
import type { FinancialMonthRepository } from '../domain/repository'

const insertFinancialMonth = (db: D1Database): FinancialMonthRepository['insertFinancialMonth'] => async (props) => {
  return props
}

export const useFinancialMonthRepositoryD1 = (db: D1Database): FinancialMonthRepository => {
  return {
    insertFinancialMonth: insertFinancialMonth(db),
    findByFinancialYear: function (financialYear: number): Promise<FinancialMonth[]> {
      throw new Error('Function not implemented.')
    },
    findByFinancialYearAndMonth: function (financialYear: number, month: Months): Promise<FinancialMonth | undefined> {
      throw new Error('Function not implemented.')
    },
    findByDate: function (date: Dayjs): Promise<FinancialMonth | undefined> {
      throw new Error('Function not implemented.')
    },
    findByDateRange: function (from: Dayjs, to: Dayjs): Promise<FinancialMonth[]> {
      throw new Error('Function not implemented.')
    },
  }
}
