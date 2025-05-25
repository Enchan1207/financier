import type { Result } from 'neverthrow'
import { ulid } from 'ulid'

import { ValidationError } from '@/logic/errors'
import { parseSchema } from '@/logic/zod'

import type { StandardRemuneration, StandardRemunerationData } from '.'
import { StandardRemunerationDataSchema } from '.'

export const createStandardRemunerationData = (input: {
  tableId: string
  min: number
  value: number
}): Result<StandardRemunerationData, ValidationError> =>
  parseSchema(StandardRemunerationDataSchema, input).mapErr(() => new ValidationError())

export const createStandardRemuneration = (props: {
  userId: string
  tableId: string
  min: number
  value: number
}): Result<StandardRemuneration, ValidationError> => {
  const { userId, ...input } = props

  return createStandardRemunerationData(input).map(entity => ({
    ...entity,
    id: ulid(),
    userId,
  }))
}
