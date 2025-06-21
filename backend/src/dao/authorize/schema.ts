import { z } from 'zod'

import type { User } from '@/domains/user'

export const UserRecordSchema = z.object({
  name: z.string(),
  auth0_user_id: z.string(),
  id: z.string(),
  email: z.string(),
})

export type UserRecord = z.infer<typeof UserRecordSchema>

export const makeUserEntity = (record: UserRecord): User => ({
  id: record.id,
  name: record.name,
  auth0UserId: record.auth0_user_id,
  email: record.email,
})

export const makeUserRecord = (entity: User): UserRecord => ({
  id: entity.id,
  name: entity.name,
  auth0_user_id: entity.auth0UserId,
  email: entity.email,
})
