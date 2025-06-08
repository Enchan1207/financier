import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { ulid } from 'ulid'

import dayjs from '@/logic/dayjs'
import { ValidationError } from '@/logic/errors'

import type { FinancialMonthData } from '../financial_month'
import { getPeriodByFinancialMonth } from '../financial_month/logic'
import type { IncomeDefinition, IncomeDefinitionKind } from '.'

export const createIncomeDefinition = (props: {
  userId: string
  name: string
  kind: IncomeDefinitionKind
  isTaxable: boolean
  value: number
  from: FinancialMonthData
  to: FinancialMonthData
}): Result<IncomeDefinition, ValidationError> => {
  const {
    userId, name, kind, value, isTaxable, from, to,
  } = props

  const { start: fromStart } = getPeriodByFinancialMonth(from)
  const { start: toStart, end } = getPeriodByFinancialMonth(to)

  if (toStart.isBefore(fromStart)) {
    const startTime = fromStart.valueOf()
    const endTime = toStart.valueOf()
    return err(new ValidationError(`from must be earlier than to (${startTime} -> ${endTime})`))
  }

  return ok({
    id: ulid(),
    userId,
    name,
    kind,
    value,
    isTaxable,
    enabledAt: fromStart,
    disabledAt: end,
    updatedAt: dayjs(),
  })
}
