import type { Definition } from '../definition'
import type { FinancialMonthContext } from '../financial_month_context'
import type { User } from '../user'

export type Actual = {
  id: string
  userId: User['id']
  definitionId: Definition['id']
  financialMonthId: FinancialMonthContext['id']
  value: number
}
