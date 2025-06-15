import { z } from 'zod'

export type UserData = {
  name: string
  auth0UserId: string
  email: string
}

export type User = UserData & { id: string }

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
