import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'

import type { User, UserId } from '../../domains/user'
import { usersTable } from '../../schemas/users'

export const findUserByIdPSubject =
  (db: DrizzleD1Database) =>
  async (idpSubject: string): Promise<User | undefined> => {
    const records = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.idp_subject, idpSubject))

    const record = records.at(0)
    if (record === undefined) {
      return undefined
    }

    return {
      id: record.id as UserId,
      idpSubject: record.idp_subject,
    }
  }

export const saveUser =
  (db: DrizzleD1Database) =>
  async (user: User): Promise<User> => {
    await db.insert(usersTable).values({
      id: user.id,
      idp_subject: user.idpSubject,
    })

    return user
  }
