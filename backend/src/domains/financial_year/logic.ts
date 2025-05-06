import { Months } from '../financial_month'
import { createFinancialMonth } from '../financial_month/logic'
import type { User } from '../user'
import type { FinancialYear } from '.'

export const createFinancialYear = (props: {
  userId: User['id']
  year: number
}): FinancialYear => {
  const { userId, year } = props

  const months = Months.map(month => createFinancialMonth({
    financialYear: year,
    userId,
    month,
  }))

  return {
    year,
    months,
  }
}
