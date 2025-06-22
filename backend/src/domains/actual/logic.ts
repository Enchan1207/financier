import type { Result } from 'neverthrow'
import { ulid } from 'ulid'

import type { ValidationError } from '@/logic/errors'
import { parseSchema } from '@/logic/zod'

import type { Definition } from '../definition'
import type { User } from '../user'
import type { Actual } from '.'
import { ActualSchema } from '.'

export const createActual = (props: {
  userId: User['id']
  financialYear: number
  month: number
  definitionId: Definition['id']
  value: number
}): Result<Actual, ValidationError> =>
  parseSchema(ActualSchema, {
    id: ulid(),
    userId: props.userId,
    financialYear: props.financialYear,
    month: props.month,
    definitionId: props.definitionId,
    value: props.value,
  })
