import type { MiddlewareHandler } from 'hono'
import { every } from 'hono/combine'
import { createMiddleware } from 'hono/factory'

import type { User } from '@/domains/user'
import type { Auth0JWTPayload } from '@/logic/middlewares/jwk'
import { jwkMiddleware, jwkValidationMiddleware } from '@/logic/middlewares/jwk'

import { getUserByAuth0Id } from './dao'
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
    //
    getUserByAuth0Id: getUserByAuth0Id(c.env.D1),
  })

  const result = await workflow(command)
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
}> = every(
  jwkMiddleware,
  jwkValidationMiddleware,
  userMiddleware,
)
