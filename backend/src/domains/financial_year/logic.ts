import { Result } from 'neverthrow'

import { ValidationError } from '@/logic/errors'
import { parseSchema } from '@/logic/zod'

import { Months } from '../financial_month_context'
import { createFinancialMonthContext } from '../financial_month_context/logic'
import type { StandardIncomeTable } from '../standard_income'
import type { User } from '../user'
import type { FinancialYear } from '.'
import { FinancialYearValueSchema } from '.'

export const createFinancialYearValue = (value: number) =>
  parseSchema(FinancialYearValueSchema, value).mapErr(
    (error) => new ValidationError(error.message),
  )

export const createFinancialYear = (props: {
  userId: User['id']
  financialYear: number
  standardIncomeTableId: StandardIncomeTable['id']
}): Result<FinancialYear, ValidationError> => {
  const { userId, financialYear, standardIncomeTableId } = props

  const results = Months.map((month) =>
    createFinancialMonthContext({
      userId,
      financialYear,
      month,
      workday: 20, // TODO: 本来は各月の祝日を参照するべき
      standardIncomeTableId,
    }),
  )

  return Result.combine(results).map((months) => ({
    year: months[0].info.financialYear,
    months,
  }))
}
