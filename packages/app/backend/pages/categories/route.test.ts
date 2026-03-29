import { createSession } from '@backend/domains/session'
import { createUser } from '@backend/domains/user'
import { signSessionJwt } from '@backend/features/session/jwt'
import dayjs from '@backend/lib/date'
import {
  SESSION_COOKIE_AGE,
  SESSION_JWT_AGE,
} from '@backend/lib/session-config'
import { categoriesTable } from '@backend/schemas/categories'
import { sessionsTable } from '@backend/schemas/sessions'
import { usersTable } from '@backend/schemas/users'
import { env } from 'cloudflare:test'
import { drizzle } from 'drizzle-orm/d1'
import { testClient } from 'hono/testing'
import { ulid } from 'ulid'

import categoriesPageRoute from './route'

describe('カテゴリページAPI', () => {
  const client = testClient(categoriesPageRoute, env)
  const db = drizzle(env.D1)

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(dayjs('2022-11-01T18:05:00Z').toDate())
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  const setupSession = async (): Promise<{ jwt: string; userId: string }> => {
    const user = createUser({
      email: 'test@example.com',
      idpIssuer: 'https://tenant.region.auth0.com/',
      idpSubject: `auth0|${ulid()}`,
    })

    await db.insert(usersTable).values({
      id: user.id,
      email: user.email,
      idp_iss: user.idpIssuer,
      idp_sub: user.idpSubject,
    })

    const now = dayjs()
    const session = createSession({
      user,
      expiresAt: now.add(SESSION_COOKIE_AGE, 'second'),
      idpSessionId: 'idp-session-123',
    })

    await db.insert(sessionsTable).values({
      id: session.id,
      user_id: session.userId,
      issued_at: session.issuedAt.toISOString(),
      expires_at: session.expiresAt.toISOString(),
      idp_session_id: session.idpSessionId,
    })

    const jwt = await signSessionJwt(env.SESSION_SECRET)({
      sessionId: session.id,
      userId: user.id,
      now,
      expiresIn: SESSION_JWT_AGE,
    })

    return { jwt, userId: user.id }
  }

  describe('GET /', () => {
    describe('正常系 - カテゴリ一覧を取得できる', () => {
      let response: Awaited<ReturnType<typeof client.index.$get>>
      let responseBody: { categories: Record<string, unknown>[] }

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()

        await db.insert(categoriesTable).values([
          {
            id: `cat-page-${ulid()}`,
            user_id: userId,
            type: 'income',
            name: '給与',
            status: 'active',
            icon: 'briefcase',
            color: 'green',
          },
          {
            id: `cat-page-${ulid()}`,
            user_id: userId,
            type: 'expense',
            name: '食費',
            status: 'active',
            icon: 'utensils',
            color: 'red',
          },
        ])

        response = await client.index.$get(
          {},
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('カテゴリ一覧が返ること', () => {
        expect(responseBody.categories).toHaveLength(2)
      })

      test('statusフィールドが含まれないこと', () => {
        for (const cat of responseBody.categories) {
          expect(cat).not.toHaveProperty('status')
        }
      })

      test('userIdフィールドが含まれないこと', () => {
        for (const cat of responseBody.categories) {
          expect(cat).not.toHaveProperty('userId')
        }
      })
    })

    describe('正常系 - アーカイブ済みカテゴリは返らないこと', () => {
      let response: Awaited<ReturnType<typeof client.index.$get>>
      let responseBody: { categories: unknown[] }

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()

        await db.insert(categoriesTable).values([
          {
            id: `cat-page-${ulid()}`,
            user_id: userId,
            type: 'expense',
            name: 'アクティブカテゴリ',
            status: 'active',
            icon: 'tag',
            color: 'blue',
          },
          {
            id: `cat-page-${ulid()}`,
            user_id: userId,
            type: 'expense',
            name: 'アーカイブ済みカテゴリ',
            status: 'archived',
            icon: 'tag',
            color: 'red',
          },
        ])

        response = await client.index.$get(
          {},
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('アクティブなカテゴリのみ返ること', () => {
        expect(responseBody.categories).toHaveLength(1)
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<typeof client.index.$get>>

      beforeAll(async () => {
        response = await client.index.$get({})
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })
  })
})
