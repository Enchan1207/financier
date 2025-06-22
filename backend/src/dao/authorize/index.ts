import type { Auth0UserInfo, User } from '@/domains/user'
import { Auth0UserInfoSchema } from '@/domains/user'
import { condition } from '@/logic/query_builder/condition_tree'
import { d1 } from '@/logic/query_builder/d1'

import type { UserRecord } from './schema'
import { makeUserEntity, makeUserRecord, UserRecordSchema } from './schema'

/** idでユーザを取得する */
const getUserById =
  (db: D1Database) =>
  async (id: string): Promise<User | undefined> => {
    const stmt = d1(db)
      .select(UserRecordSchema, 'users')
      .where(condition('id', '==', id))
      .build()

    return stmt
      .first<UserRecord>()
      .then((item) => (item === null ? undefined : makeUserEntity(item)))
  }

/** Auth0のidでユーザを検索する */
const findUserByAuth0Id =
  (db: D1Database) =>
  async (id: string): Promise<User | undefined> => {
    const stmt = d1(db)
      .select(UserRecordSchema, 'users')
      .where(condition('auth0_user_id', '==', id))
      .build()

    return stmt
      .first<UserRecord>()
      .then((item) => (item === null ? undefined : makeUserEntity(item)))
  }

/** ユーザ情報を挿入または上書きする */
const saveUser =
  (db: D1Database) =>
  async (newUser: User): Promise<User> => {
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

/** ユーザ情報取得関数を構成する */
const fetchUserInfo =
  (authDomain: string) =>
  async (token: string): Promise<Auth0UserInfo | undefined> => {
    const response = await fetch(`https://${authDomain}/userinfo`, {
      headers: { Authorization: token },
    }).then((response) => response.json())

    const { success, data } = Auth0UserInfoSchema.safeParse(response)
    return success ? data : undefined
  }

export { fetchUserInfo, findUserByAuth0Id, getUserById, saveUser }
