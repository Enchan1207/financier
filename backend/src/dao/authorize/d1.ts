import { Auth0UserInfoSchema } from '@/domains/user'
import { condition } from '@/logic/query_builder/condition_tree'
import { d1 } from '@/logic/query_builder/d1'

import type { AuthorizeDao } from '.'
import type { UserRecord } from './schema'
import { makeUserEntity, makeUserRecord, UserRecordSchema } from './schema'

/** idでユーザを取得する */
export const getUserById =
  (db: D1Database): AuthorizeDao['getUserById'] =>
  async (id) => {
    const stmt = d1(db)
      .select(UserRecordSchema, 'users')
      .where(condition('id', '==', id))
      .build()

    return stmt
      .first<UserRecord>()
      .then((item) => (item === null ? undefined : makeUserEntity(item)))
  }

export const findUserByAuth0Id =
  (db: D1Database): AuthorizeDao['findUserByAuth0Id'] =>
  async (id) => {
    const stmt = d1(db)
      .select(UserRecordSchema, 'users')
      .where(condition('auth0_user_id', '==', id))
      .build()

    return stmt
      .first<UserRecord>()
      .then((item) => (item === null ? undefined : makeUserEntity(item)))
  }

export const saveUser =
  (db: D1Database): AuthorizeDao['saveUser'] =>
  async (newUser) => {
    const stmt = `INSERT INTO users 
    VALUES (?1,?2,?3,?4)
    ON CONFLICT (id) DO UPDATE SET
        name = excluded.name,
        auth0_user_id = excluded.auth0_user_id,
        email = excluded.email
  `

    const newUserRecord = makeUserRecord(newUser)

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

export const fetchUserInfo: AuthorizeDao['fetchUserInfo'] =
  (authDomain: string) => async (token: string) => {
    const response = await fetch(`https://${authDomain}/userinfo`, {
      headers: { Authorization: token },
    }).then((response) => response.json())

    const { success, data } = Auth0UserInfoSchema.safeParse(response)
    return success ? data : undefined
  }
