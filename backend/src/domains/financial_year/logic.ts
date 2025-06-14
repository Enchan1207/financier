import { Result } from 'neverthrow'

import { ValidationError } from '@/logic/errors'
import { parseSchema } from '@/logic/zod'

import { Months } from '../financial_month_context'
import { createFinancialMonthContext } from '../financial_month_context/logic'
import type { User } from '../user'
import type { FinancialYear } from '.'
import { FinancialYearValueSchema } from '.'

export const createFinancialYearValue = (value: number) =>
  parseSchema(FinancialYearValueSchema, value).mapErr(
    () => new ValidationError(),
  )

export const createFinancialYear = (props: {
  userId: User['id']
  year: number
}): Result<FinancialYear, ValidationError> => {
  const { userId, year } = props

  const results = Months.map((month) =>
    createFinancialMonthContext({
      userId,
      financialYear: year,
      month,
      workday: 20, // TODO: 本来は各月の祝日を参照するべき
      standardIncomeTableId: '', // TODO: 年度初期化時にDIできるようにする?
    }),
  )

  return Result.combine(results).map((months) => ({
    year: months[0].info.financialYear,
    months,
  }))
}
