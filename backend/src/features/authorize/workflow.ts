import type { ResultAsync } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { ulid } from 'ulid'

import type { User } from '@/domains/user'
import { fromSafePromise } from '@/logic/neverthrow'

import type { Auth0UserInfo } from './dao'
import { fetchUserInfo } from './dao'

export interface Command {
  input: {
    auth0UserId: string
    token: string
  }
  state: { authDomain: string }
}

export interface UserPrepared {
  input: { user: User }
  state: {
    authDomain: string
    stored: boolean
  }
}

export type AuthorizeWorkflow = (
  command: Command,
) => ResultAsync<UserPrepared, Error>

const lookupUserByAuth0Id = (effects: {
  getUserByAuth0Id: (id: string) => Promise<User | undefined>
}): ((command: Command) => ResultAsync<UserPrepared, Error>) =>
  fromSafePromise(async (command) => {
    const user = await effects.getUserByAuth0Id(command.input.auth0UserId)
    return user
      ? ok({
          input: { user },
          state: {
            authDomain: command.state.authDomain,
            stored: true,
          },
        })
      : err(
          new Error('与えられたidに合致するユーザは存在しない', {
            cause: command,
          }),
        )
  })

const createTentativeUser = (effects: {
  fetchUserInfo: (token: string) => Promise<Auth0UserInfo | undefined>
}): ((command: Command) => ResultAsync<UserPrepared, Error>) =>
  fromSafePromise(async (command) => {
    const userInfo = await effects.fetchUserInfo(command.input.token)
    if (userInfo === undefined) {
      return err(
        new Error('Auth0からユーザ情報を取得できなかった', { cause: command }),
      )
    }

    const newUser: User = {
      id: ulid(),
      name: userInfo.nickname,
      auth0UserId: userInfo.sub,
      email: userInfo.email,
    }

    return ok({
      input: { user: newUser },
      state: {
        authDomain: command.state.authDomain,
        stored: false,
      },
    })
  })

export const createAuthorizeWorkflow =
  (effects: {
    //
    getUserByAuth0Id: (id: string) => Promise<User | undefined>
  }): AuthorizeWorkflow =>
  (command: Command) =>
    ok(command)
      .asyncAndThen(
        lookupUserByAuth0Id({
          //
          getUserByAuth0Id: effects.getUserByAuth0Id,
        }),
      )
      .orElse(() =>
        createTentativeUser({
          //
          fetchUserInfo: fetchUserInfo(command.state.authDomain),
        })(command),
      )
