import { z } from 'zod'

import { EntityIdSchema } from '@/domains/schema'

export const UserDataSchema = z.object({
  name: z.string(),
  auth0UserId: z.string(),
  email: z.string(),
})
export type UserData = z.infer<typeof UserDataSchema>

export const UserSchema = UserDataSchema.extend({
  id: EntityIdSchema('user'),
})

export type User = z.infer<typeof UserSchema>

export const Auth0UserInfoSchema = z.object({
  sub: z.string(),
  nickname: z.string(),
  name: z.string(),
  email: z.string(),
  picture: z.string(),
  updated_at: z.string(),
  email_verified: z.boolean(),
})
export type Auth0UserInfo = z.infer<typeof Auth0UserInfoSchema>
