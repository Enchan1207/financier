import { ulid } from 'ulid'

import type { User, UserData } from '.'

export const createUser = (userData: UserData): User => ({
  id: ulid(),
  ...userData,
})
