import { env, fetchMock } from 'cloudflare:test'
import { sign } from 'hono/jwt'
import { testClient } from 'hono/testing'

import type { User } from '@/domains/user'

import { getUserById, saveUser } from '../authorize/dao'
import users from './route'

describe('ユーザが存在する場合 (登録済みアカウントへのログイン)', () => {
  const client = testClient(users, env)

  const testUser: User = {
    id: 'test_user_id',
    name: 'test user',
    auth0UserId: 'test_user',
    email: 'test@example.com',
  }

  let token: string

  beforeAll(async () => {
    token = await sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        iss: `https://${env.AUTH_DOMAIN}/`,
        sub: testUser.auth0UserId,
        aud: [env.AUTH_AUDIENCE],
      },
      env.TEST_PRIVATE_KEY,
      'RS256',
    )

    // テストユーザを登録
    await saveUser(env.D1)(testUser)
  })

  afterEach(() => {
    fetchMock.assertNoPendingInterceptors()
  })

  test('項目を取得できること', async () => {
    const result = await client.me.$get(undefined, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const stored = await result.json()
    expect(stored).toStrictEqual(testUser)
  })
})

describe('ユーザが存在しない場合 (未登録アカウントへのログイン)', () => {
  const client = testClient(users, env)

  let token: string

  let registered: User

  beforeAll(async () => {
    token = await sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        iss: `https://${env.AUTH_DOMAIN}/`,
        sub: 'unregistered_user_id',
        aud: [env.AUTH_AUDIENCE],
      },
      env.TEST_PRIVATE_KEY,
      'RS256',
    )

    fetchMock
      .get(`https://${env.AUTH_DOMAIN}`)
      .intercept({
        method: 'GET',
        path: '/userinfo',
      })
      .reply(200, {
        sub: 'unregistered_user_id',
        nickname: 'nickname',
        name: 'fullname',
        email: '',
        picture: '',
        updated_at: '',
        email_verified: true,
      })
      .persist()

    const result = await client.me.$get(undefined, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    registered = await result.json()
  })

  afterEach(() => {
    fetchMock.assertNoPendingInterceptors()
  })

  test('ユーザが登録されていること', async () => {
    const { id } = registered
    const stored = await getUserById(env.D1)(id)
    expect(stored).toBeDefined()
  })
})
