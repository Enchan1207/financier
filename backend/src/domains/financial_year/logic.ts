import { err, Result } from 'neverthrow'

import { ValidationError } from '@/logic/errors'
import { parseSchema } from '@/logic/zod'

import { Months } from '../financial_month'
import { createFinancialMonth } from '../financial_month/logic'
import type { User } from '../user'
import type { FinancialYear } from '.'
import { FinancialYearValueSchema } from '.'

export const createFinancialYearValue = (value: number) =>
  parseSchema(FinancialYearValueSchema, value).mapErr(() => new ValidationError())

export const createFinancialYear = (props: {
  userId: User['id']
  year: number
}): Result<FinancialYear, ValidationError> => {
  const { userId, year } = props

  const yearParseResult = parseSchema(FinancialYearValueSchema, year)
  if (yearParseResult.isErr()) {
    return err(new ValidationError())
  }

  const results = Months.map(month => createFinancialMonth({
    financialYear: yearParseResult.value,
    userId,
    month,
    workday: 20, // TODO: 本来は各月の祝日を参照するべき
  }))

  return Result.combine(results)
    .map(months => ({
      year: yearParseResult.value,
      months,
    }))
}
