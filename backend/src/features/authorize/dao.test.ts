import { env } from 'cloudflare:test'
import { ulid } from 'ulid'

import type { User } from '@/domains/user'

import {
  getUserByAuth0Id, getUserById, saveUser,
} from './dao'

describe('単一項目のCRUD', () => {
  test('項目を作成できること', async () => {
    const user: User = {
      id: ulid(),
      name: 'test-user',
      auth0UserId: 'auth0|0123456789',
      email: 'test@example.com',
    }
    const inserted = await saveUser(env.D1)(user)
    expect(user).toStrictEqual(inserted)
  })

  test('IDを指定して項目を取得できること', async () => {
    const user: User = {
      id: ulid(),
      name: 'test-user',
      auth0UserId: 'auth0|0123456789',
      email: 'test@example.com',
    }
    const { id } = await saveUser(env.D1)(user)

    const stored = await getUserById(env.D1)(id)
    expect(stored).toBeDefined()
  })

  test('Auth0 IDを指定して項目を取得できること', async () => {
    const user: User = {
      id: ulid(),
      name: 'test-user',
      auth0UserId: 'auth0|0123456789',
      email: 'test@example.com',
    }
    const { auth0UserId } = await saveUser(env.D1)(user)

    const stored = await getUserByAuth0Id(env.D1)(auth0UserId)
    expect(stored).toBeDefined()
  })

  test('挿入した項目を更新できること', async () => {
    const user: User = {
      id: ulid(),
      name: 'test-user',
      auth0UserId: 'auth0|0123456789',
      email: 'test@example.com',
    }
    const stored = await saveUser(env.D1)(user)

    const input: User = {
      ...stored,
      name: 'updated',
      auth0UserId: 'auth0|9876543210',
    }
    const updated = await saveUser(env.D1)(input)
    expect(updated).toStrictEqual(input)
  })
})
