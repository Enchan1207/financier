import type { Result } from 'neverthrow'
import { ulid } from 'ulid'

import { ValidationError } from '@/logic/errors'
import { parseSchema } from '@/logic/zod'

import type { StandardIncomeGrade, StandardIncomeTable } from '.'
import { StandardIncomeGradeSchema, StandardIncomeTableSchema } from '.'

export const createStandardIncomeGrade = (props: {
  threshold: number
  standardIncome: number
}): Result<StandardIncomeGrade, ValidationError> =>
  parseSchema(StandardIncomeGradeSchema, props).mapErr(() => new ValidationError())

export const createStandardIncomeTable = (props: {
  userId: string
  name: string
  grades: {
    threshold: number
    standardIncome: number
  }[]
}): Result<StandardIncomeTable, ValidationError> =>
  parseSchema(StandardIncomeTableSchema, {
    ...props,
    id: ulid(),
  }).mapErr(() => new ValidationError())
