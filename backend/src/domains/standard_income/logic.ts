import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { ulid } from 'ulid'

import { ValidationError } from '@/logic/errors'
import { parseSchema } from '@/logic/zod'

import type { StandardIncomeGrade, StandardIncomeTable } from '.'
import { StandardIncomeGradeSchema, StandardIncomeTableSchema } from '.'

export const createStandardIncomeGrade = (props: {
  threshold: number
  standardIncome: number
}): Result<StandardIncomeGrade, ValidationError> =>
  parseSchema(StandardIncomeGradeSchema, props).mapErr(
    () => new ValidationError(),
  )

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
  })
    .mapErr(() => new ValidationError())
    .andThen(validateGradeContinuity)

const validateGradeContinuity = (
  table: StandardIncomeTable,
): Result<StandardIncomeTable, ValidationError> => {
  const grades = table.grades

  // 最初の階級における閾値はゼロ円から始まる
  if (grades[0].threshold !== 0) {
    return err(
      new ValidationError(
        '最小値の階級における閾値はゼロ円でなければなりません',
      ),
    )
  }

  // ある階級における標準報酬月額は、その閾値以上でなければならない
  const isIncludesInvalidStandardIncome = grades.some(
    (grade) => grade.standardIncome < grade.threshold,
  )
  if (isIncludesInvalidStandardIncome) {
    return err(
      new ValidationError(
        '階級における標準報酬月額が閾値を下回ってはなりません',
      ),
    )
  }

  // ある階級における閾値が、前の階級における標準報酬月額以下であってはならない
  const isIncludesInvalidThreshold = grades.reduce((isValid, grade, index) => {
    if (index === 0) {
      return isValid
    }

    return isValid || grade.threshold <= grades[index - 1].standardIncome
  }, false)
  if (isIncludesInvalidThreshold) {
    return err(
      new ValidationError(
        'ある階級の閾値は前の階級における標準報酬月額を下回ってはなりません',
      ),
    )
  }

  return ok(table)
}
