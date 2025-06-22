import type { MiddlewareHandler } from 'hono'
import { every } from 'hono/combine'
import { createMiddleware } from 'hono/factory'

import { fetchUserInfo, findUserByAuth0Id, saveUser } from '@/dao/authorize/d1'
import type { User } from '@/domains/user'
import type { Auth0JWTPayload } from '@/logic/middlewares/jwk'
import { jwkMiddleware, jwkValidationMiddleware } from '@/logic/middlewares/jwk'

import type { Command } from './workflow'
import { createAuthorizeWorkflow } from './workflow'

/** JWTペイロードからログインユーザをルックアップする */
const userMiddleware = createMiddleware<{
  Bindings: Env
  Variables: {
    jwtPayload: Auth0JWTPayload
    user: User
  }
}>(async (c, next) => {
  const command: Command = {
    input: {
      auth0UserId: c.get('jwtPayload').sub,
      token: c.req.header('Authorization') ?? '',
    },
    state: { authDomain: c.env.AUTH_DOMAIN },
  }

  const workflow = createAuthorizeWorkflow({
    getUserByAuth0Id: findUserByAuth0Id(c.env.D1),
    fetchUserInfo: fetchUserInfo,
  })

  const result = await workflow(command).andTee(async (command) => {
    if (command.state.stored) {
      return
    }

    const newUser = command.input.user
    await saveUser(c.env.D1)(newUser)
    console.log(`新規ユーザが登録されました。${JSON.stringify(newUser)}`)
  })
  if (result.isErr()) {
    throw result.error
  }

  c.set('user', result.value.input.user)
  await next()
})

/** ユーザの認証・認可を行う */
export const userAuthMiddleware: MiddlewareHandler<{
  Bindings: Env
  Variables: { user: User }
}> = every(jwkMiddleware, jwkValidationMiddleware, userMiddleware)
