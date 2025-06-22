import type { Result } from 'neverthrow'
import { ulid } from 'ulid'

import dayjs from '@/logic/dayjs'
import type { ValidationError } from '@/logic/errors'
import { parseSchema } from '@/logic/zod'

import type { Definition } from '../definition'
import type { MonthlyContext } from '../monthly_context'
import type { User } from '../user'
import type { Actual } from '.'
import { ActualSchema } from '.'

export const createActual = (props: {
  userId: User['id']
  monthlyContextId: MonthlyContext['id']
  definitionId: Definition['id']
  value: number
}): Result<Actual, ValidationError> =>
  parseSchema(ActualSchema, {
    id: ulid(),
    userId: props.userId,
    monthlyContextId: props.monthlyContextId,
    definitionId: props.definitionId,
    value: props.value,
    updatedAt: dayjs().timestamp(),
  })
