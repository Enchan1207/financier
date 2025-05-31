import type { Result } from 'neverthrow'
import { ulid } from 'ulid'

import { ValidationError } from '@/logic/errors'
import { parseSchema } from '@/logic/zod'

import type { StandardIncome, StandardIncomeData } from '.'
import { StandardIncomeDataSchema } from '.'

export const createStandardIncomeData = (input: {
  tableId: string
  min: number
  value: number
}): Result<StandardIncomeData, ValidationError> =>
  parseSchema(StandardIncomeDataSchema, input).mapErr(() => new ValidationError())

export const createStandardIncome = (props: {
  userId: string
  tableId: string
  min: number
  value: number
}): Result<StandardIncome, ValidationError> => {
  const { userId, ...input } = props

  return createStandardIncomeData(input).map(entity => ({
    ...entity,
    id: ulid(),
    userId,
  }))
}
