import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { Context, MiddlewareHandler } from 'hono'

import type { User } from '../../domains/user'
import type { Auth0JWTPayload } from '../../middlewares/auth'
import { findUserByIdPSubject, saveUser } from './repository'
import { buildLoginWorkflow } from './workflow'

type Variables = {
  jwtPayload: Auth0JWTPayload
  drizzle: DrizzleD1Database
  user: User
}

/**
 * 認証されたユーザ情報を取得するmiddleware
 * jwtPayloadからIdPSubjectを取得し、ログインワークフローを実行する
 */
export const useAuth = (): MiddlewareHandler<{ Variables: Variables }> => {
  return async (c: Context<{ Variables: Variables }>, next) => {
    const idpSubject = c.get('jwtPayload').sub
    const db = c.get('drizzle')

    const event = await buildLoginWorkflow(
      findUserByIdPSubject(db),
      saveUser(db),
    )({
      idpSubject,
    })

    c.set('user', event.user)

    await next()
  }
}
