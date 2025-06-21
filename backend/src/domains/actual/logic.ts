import { ulid } from 'ulid'

import type { Definition } from '../definition'
import type { FinancialMonthContext } from '../financial_month_context'
import type { User } from '../user'
import type { Actual } from '.'

export const createActual = (props: {
  userId: User['id']
  definitionId: Definition['id']
  financialMonthId: FinancialMonthContext['id']
  value: number
}): Actual => ({
  id: ulid(),
  userId: props.userId,
  definitionId: props.definitionId,
  financialMonthId: props.financialMonthId,
  value: props.value,
})
