import { createSession } from '@backend/domains/session'
import { createUser } from '@backend/domains/user'
import { signSessionJwt } from '@backend/features/session/jwt'
import dayjs from '@backend/lib/date'
import {
  SESSION_COOKIE_AGE,
  SESSION_JWT_AGE,
} from '@backend/lib/session-config'
import { categoriesTable } from '@backend/schemas/categories'
import { eventsTable } from '@backend/schemas/events'
import { sessionsTable } from '@backend/schemas/sessions'
import { transactionsTable } from '@backend/schemas/transactions'
import { usersTable } from '@backend/schemas/users'
import { env } from 'cloudflare:test'
import { drizzle } from 'drizzle-orm/d1'
import { testClient } from 'hono/testing'
import { ulid } from 'ulid'

import eventRoute from './route'

describe('イベントAPI', () => {
  const client = testClient(eventRoute, env)
  const db = drizzle(env.D1)

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(dayjs('2024-04-15T10:00:00Z').toDate())
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

  const insertEvent = async (
    userId: string,
    overrides: Partial<{
      id: string
      name: string
      occurred_on: string
    }> = {},
  ) => {
    const event = {
      id: `evt-${ulid()}`,
      user_id: userId,
      name: 'テストイベント',
      occurred_on: '2024-04-01',
      ...overrides,
    }
    await db.insert(eventsTable).values(event)
    return event
  }

  const insertCategory = async (
    userId: string,
    overrides: Partial<{
      id: string
      type: string
      name: string
      status: string
      icon: string
      color: string
    }> = {},
  ) => {
    const category = {
      id: `cat-${ulid()}`,
      user_id: userId,
      type: 'expense',
      name: '食費',
      status: 'active',
      icon: 'utensils',
      color: 'red',
      ...overrides,
    }
    await db.insert(categoriesTable).values(category)
    return category
  }

  const insertTransaction = async (
    userId: string,
    categoryId: string,
    eventId: string,
  ) => {
    const transaction = {
      id: `txn-${ulid()}`,
      user_id: userId,
      type: 'expense',
      amount: 5000,
      category_id: categoryId,
      event_id: eventId,
      name: '食料品',
      transaction_date: '2024-04-15',
      created_at: dayjs().toISOString(),
    }
    await db.insert(transactionsTable).values(transaction)
    return transaction
  }

  describe('POST /', () => {
    describe('正常系 - イベントを作成できる', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>
      let responseBody: {
        event: { id: string; name: string; occurredOn: string }
      }

      beforeAll(async () => {
        const { jwt: sessionJwt } = await setupSession()

        response = await client.index.$post(
          {
            json: {
              name: '春の旅行',
              occurredOn: '2024-04-01',
            },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('201が返ること', () => {
        expect(response.status).toBe(201)
      })

      test('nameが正しいこと', () => {
        expect(responseBody.event.name).toBe('春の旅行')
      })

      test('occurredOnが正しいこと', () => {
        expect(responseBody.event.occurredOn).toBe('2024-04-01')
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>

      beforeAll(async () => {
        response = await client.index.$post({
          json: { name: 'テスト', occurredOn: '2024-04-01' },
        })
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })
  })

  describe('PUT /:id', () => {
    describe('正常系 - イベントを更新できる', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>
      let responseBody: { event: { name: string; occurredOn: string } }

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const event = await insertEvent(userId)

        response = await client[':id'].$put(
          {
            param: { id: event.id },
            json: { name: '更新後イベント' },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('nameが更新されること', () => {
        expect(responseBody.event.name).toBe('更新後イベント')
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>

      beforeAll(async () => {
        response = await client[':id'].$put({
          param: { id: 'any-id' },
          json: { name: 'テスト' },
        })
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })

    describe('異常系 - 存在しないイベントIDを指定', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>

      beforeAll(async () => {
        const { jwt: sessionJwt } = await setupSession()

        response = await client[':id'].$put(
          {
            param: { id: 'non-existent-event-id-00001' },
            json: { name: 'テスト' },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('404が返ること', () => {
        expect(response.status).toBe(404)
      })
    })
  })

  describe('DELETE /:id', () => {
    describe('正常系 - イベントを削除できる', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$delete']>>
      let responseBody: { event: { id: string } }

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const event = await insertEvent(userId)

        response = await client[':id'].$delete(
          { param: { id: event.id } },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('削除されたイベントのIDが返ること', () => {
        expect(responseBody.event.id).toBeDefined()
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$delete']>>

      beforeAll(async () => {
        response = await client[':id'].$delete({ param: { id: 'any-id' } })
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })

    describe('異常系 - 存在しないイベントIDを指定', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$delete']>>

      beforeAll(async () => {
        const { jwt: sessionJwt } = await setupSession()

        response = await client[':id'].$delete(
          { param: { id: 'non-existent-event-id-00001' } },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('404が返ること', () => {
        expect(response.status).toBe(404)
      })
    })

    describe('異常系 - トランザクションが紐づいているイベントは削除できない', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$delete']>>

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const event = await insertEvent(userId)
        const category = await insertCategory(userId)
        await insertTransaction(userId, category.id, event.id)

        response = await client[':id'].$delete(
          { param: { id: event.id } },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('409が返ること', () => {
        expect(response.status).toBe(409)
      })
    })
  })
})
