import { ResultAsync } from 'neverthrow'
import { ulid } from 'ulid'
import { z } from 'zod'

import type { User } from './entity'
import type { UserRepository } from './repository'

const Auth0UserInfoSchema = z.object({
  sub: z.string(),
  nickname: z.string(),
  name: z.string(),
  email: z.string(),
  picture: z.string(),
  updated_at: z.string(),
  email_verified: z.boolean(),
})
type Auth0UserInfo = z.infer<typeof Auth0UserInfoSchema>

export interface UserUsecase {
  /** Auth0のユーザIDからユーザを取得する */
  lookupUserByAuth0Id(auth0UserId: string): ResultAsync<User, Error>

  /** 認証トークンをAuth0に投げ、暫定ユーザを作成する */
  createTentativeUser(props: {
    authDomain: string
    token: string
  }): ResultAsync<User, Error>
}

class UserUsecaseError extends Error {}

const lookupUserByAuth0Id = (repository: UserRepository): UserUsecase['lookupUserByAuth0Id'] =>
  ResultAsync.fromThrowable(async (auth0UserId) => {
    const user = await repository.getUserByAuth0Id(auth0UserId)
    if (user === undefined) {
      throw new UserUsecaseError('ユーザが登録されていない')
    }

    return user
  }, e => e instanceof UserUsecaseError ? e : new Error('unexpected error'))

const createTentativeUser = (repository: UserRepository): UserUsecase['createTentativeUser'] =>
  ResultAsync.fromThrowable(async (props) => {
    const userInfo = await fetchUserInfo(props)
    if (userInfo === undefined) {
      throw new UserUsecaseError('Auth0からユーザ情報を取得できなかった')
    }

    const newUser: User = {
      id: ulid(),
      name: userInfo.nickname,
      auth0_user_id: userInfo.sub,
      email: userInfo.email,
    }

    return repository.saveUser(newUser)
  }, e => e instanceof UserUsecaseError ? e : new Error('unexpected error'))

const fetchUserInfo = async (props: {
  authDomain: string
  token: string
}): Promise<Auth0UserInfo | undefined> => {
  const response = await fetch(`https://${props.authDomain}/userinfo`,
    { headers: { Authorization: props.token } })
    .then(response => response.json())

  const { success, data } = Auth0UserInfoSchema.safeParse(response)
  return success ? data : undefined
}

export const useUserUsecase = (repository: UserRepository): UserUsecase => ({
  lookupUserByAuth0Id: lookupUserByAuth0Id(repository),
  createTentativeUser: createTentativeUser(repository),
})
