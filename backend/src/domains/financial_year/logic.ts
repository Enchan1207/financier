import type { Result } from 'neverthrow'
import { ulid } from 'ulid'

import type { ValidationError } from '@/logic/errors'
import { parseSchema } from '@/logic/zod'

import { Months } from '../monthly_context'
import type { StandardIncomeTable } from '../standard_income'
import type { User } from '../user'
import type { FinancialYear } from '.'
import { FinancialYearSchema } from '.'

export const createFinancialYear = (props: {
  userId: User['id']
  year: number
  standardIncomeTable: StandardIncomeTable
}): Result<FinancialYear, ValidationError> =>
  parseSchema(FinancialYearSchema, {
    id: ulid(),
    userId: props.userId,
    year: props.year,
    months: Months.map((month) => ({ id: ulid(), month })),
    standardIncomeTable: props.standardIncomeTable,
  })
