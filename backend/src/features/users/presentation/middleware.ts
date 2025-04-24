import type { MiddlewareHandler } from 'hono'
import { every } from 'hono/combine'
import { createMiddleware } from 'hono/factory'
import { ok } from 'neverthrow'

import type { User } from '@/features/users/domain/entity'
import { useUserUsecase } from '@/features/users/domain/usecase'
import { useUserRepositoryD1 } from '@/features/users/infrastructure/repositoryImpl'
import type { Auth0JWTPayload } from '@/logic/middlewares/jwk'
import { jwkMiddleware, jwkValidationMiddleware } from '@/logic/middlewares/jwk'

/** JWTペイロードからログインユーザをルックアップする */
const userMiddleware = createMiddleware<{
  Bindings: Env
  Variables: {
    jwtPayload: Auth0JWTPayload
    user: User
  }
}>(async (c, next) => {
  const { sub: auth0UserId } = c.get('jwtPayload')
  const repo = useUserRepositoryD1(c.env.D1)
  const usecase = useUserUsecase(repo)

  const result = await ok(auth0UserId)
    .asyncAndThen(auth0UserId => usecase.lookupUserByAuth0Id(auth0UserId))
    .orElse(() => usecase.createTentativeUser({
      authDomain: c.env.AUTH_DOMAIN,
      token: c.req.header('Authorization') ?? '',
    }).andTee((newUser) => {
      console.log(`New user registered. ${JSON.stringify(newUser)}`)
    }))

  if (result.isErr()) {
    throw result.error
  }

  c.set('user', result.value)
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
