import type { Result } from 'neverthrow'
import { ulid } from 'ulid'

import type { ValidationError } from '@/logic/errors'
import { parseSchema } from '@/logic/zod'

import type { User, UserData } from '.'
import { UserSchema } from '.'

export const createUser = (userData: UserData): Result<User, ValidationError> =>
  parseSchema(UserSchema, {
    ...userData,
    id: ulid(),
  })
