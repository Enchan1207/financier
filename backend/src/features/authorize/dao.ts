import { z } from 'zod'

import type { User } from '@/domains/user'
import { condition } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

const Auth0UserInfoSchema = z.object({
  sub: z.string(),
  nickname: z.string(),
  name: z.string(),
  email: z.string(),
  picture: z.string(),
  updated_at: z.string(),
  email_verified: z.boolean(),
})
export type Auth0UserInfo = z.infer<typeof Auth0UserInfoSchema>

const UserRecord = z.object({
  name: z.string(),
  auth0_user_id: z.string(),
  id: z.string(),
  email: z.string(),
})

type UserRecord = z.infer<typeof UserRecord>

const makeEntity = ({ id, name, auth0_user_id, email }: UserRecord): User => ({
  id,
  name,
  auth0UserId: auth0_user_id,
  email,
})

const makeRecord = ({ id, name, auth0UserId, email }: User): UserRecord => ({
  id,
  name,
  auth0_user_id: auth0UserId,
  email,
})

export const getUserById =
  (db: D1Database) =>
  async (id: string): Promise<User | undefined> => {
    const stmt = d1(db)
      .select(UserRecord, 'users')
      .where(condition('id', '==', id))
      .build()

    return stmt
      .first<UserRecord>()
      .then((item) => (item === null ? undefined : makeEntity(item)))
  }

export const getUserByAuth0Id =
  (db: D1Database) =>
  async (id: string): Promise<User | undefined> => {
    const stmt = d1(db)
      .select(UserRecord, 'users')
      .where(condition('auth0_user_id', '==', id))
      .build()
    return stmt
      .first<UserRecord>()
      .then((item) => (item === null ? undefined : makeEntity(item)))
  }

export const saveUser =
  (db: D1Database) =>
  async (newUser: User): Promise<User> => {
    const stmt = `INSERT INTO users 
    VALUES (?1,?2,?3,?4)
    ON CONFLICT (id) DO UPDATE SET
        name = ?2,
        auth0_user_id = ?3,
        email = ?4
  `

    const newUserRecord = makeRecord(newUser)

    await db
      .prepare(stmt)
      .bind(
        newUserRecord.id,
        newUserRecord.name,
        newUserRecord.auth0_user_id,
        newUserRecord.email,
      )
      .run()

    return newUser
  }

export const fetchUserInfo =
  (authDomain: string) =>
  async (token: string): Promise<Auth0UserInfo | undefined> => {
    const response = await fetch(`https://${authDomain}/userinfo`, {
      headers: { Authorization: token },
    }).then((response) => response.json())

    const { success, data } = Auth0UserInfoSchema.safeParse(response)
    return success ? data : undefined
  }
