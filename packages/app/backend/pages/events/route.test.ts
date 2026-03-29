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

import eventsPageRoute from './route'

describe('イベントページAPI', () => {
  const client = testClient(eventsPageRoute, env)
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
    overrides: Partial<{
      id: string
      amount: number
      name: string
      type: string
    }> = {},
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
      ...overrides,
    }
    await db.insert(transactionsTable).values(transaction)
    return transaction
  }

  describe('GET /', () => {
    describe('正常系 - イベント一覧を取得できる', () => {
      let response: Awaited<ReturnType<typeof client.index.$get>>
      let responseBody: {
        events: { id: string; totalAmount: number; transactionCount: number }[]
      }

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const event = await insertEvent(userId)
        const category = await insertCategory(userId)
        await insertTransaction(userId, category.id, event.id, { amount: 3000 })
        await insertTransaction(userId, category.id, event.id, { amount: 2000 })

        response = await client.index.$get(
          {},
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('イベント一覧が返ること', () => {
        expect(responseBody.events).toHaveLength(1)
      })

      test('totalAmountが正しく集計されること', () => {
        const [event] = responseBody.events
        expect(event?.totalAmount).toBe(5000)
      })

      test('transactionCountが正しく集計されること', () => {
        const [event] = responseBody.events
        expect(event?.transactionCount).toBe(2)
      })
    })

    describe('正常系 - トランザクションのないイベントはtotalAmount=0で返ること', () => {
      let response: Awaited<ReturnType<typeof client.index.$get>>
      let responseBody: {
        events: { totalAmount: number; transactionCount: number }[]
      }

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        await insertEvent(userId)

        response = await client.index.$get(
          {},
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('totalAmountが0であること', () => {
        const [event] = responseBody.events
        expect(event?.totalAmount).toBe(0)
      })

      test('transactionCountが0であること', () => {
        const [event] = responseBody.events
        expect(event?.transactionCount).toBe(0)
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

  describe('GET /:id', () => {
    describe('正常系 - イベント詳細を取得できる', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$get']>>
      let responseBody: {
        event: {
          id: string
          transactions: { amount: number }[]
          categoryBreakdown: { categoryName: string; amount: number }[]
        }
      }

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const event = await insertEvent(userId)
        const category = await insertCategory(userId, { name: '食費' })
        await insertTransaction(userId, category.id, event.id, { amount: 3000 })
        await insertTransaction(userId, category.id, event.id, { amount: 2000 })

        response = await client[':id'].$get(
          { param: { id: event.id } },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('トランザクション一覧が返ること', () => {
        expect(responseBody.event.transactions).toHaveLength(2)
      })

      test('同一カテゴリのトランザクションが集計されること', () => {
        expect(responseBody.event.categoryBreakdown).toHaveLength(1)
      })

      test('集計結果のカテゴリ名が正しいこと', () => {
        const [breakdown] = responseBody.event.categoryBreakdown
        expect(breakdown?.categoryName).toBe('食費')
      })

      test('集計結果の金額が正しいこと', () => {
        const [breakdown] = responseBody.event.categoryBreakdown
        expect(breakdown?.amount).toBe(5000)
      })
    })

    describe('正常系 - 複数カテゴリのトランザクションがカテゴリ別に集計されること', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$get']>>
      let responseBody: {
        event: {
          categoryBreakdown: { categoryName: string; amount: number }[]
        }
      }

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const event = await insertEvent(userId)
        const catFood = await insertCategory(userId, { name: '食費' })
        const catTravel = await insertCategory(userId, { name: '交通費' })
        await insertTransaction(userId, catFood.id, event.id, { amount: 3000 })
        await insertTransaction(userId, catTravel.id, event.id, {
          amount: 1500,
        })
        await insertTransaction(userId, catTravel.id, event.id, { amount: 500 })

        response = await client[':id'].$get(
          { param: { id: event.id } },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('カテゴリ数分の内訳が返ること', () => {
        expect(responseBody.event.categoryBreakdown).toHaveLength(2)
      })

      test('食費カテゴリの金額が正しく集計されること', () => {
        const food = responseBody.event.categoryBreakdown.find(
          (b) => b.categoryName === '食費',
        )
        expect(food?.amount).toBe(3000)
      })

      test('交通費カテゴリの金額が正しく集計されること', () => {
        const travel = responseBody.event.categoryBreakdown.find(
          (b) => b.categoryName === '交通費',
        )
        expect(travel?.amount).toBe(2000)
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$get']>>

      beforeAll(async () => {
        response = await client[':id'].$get({ param: { id: 'any-id' } })
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })

    describe('異常系 - 存在しないイベントIDを指定', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$get']>>

      beforeAll(async () => {
        const { jwt: sessionJwt } = await setupSession()

        response = await client[':id'].$get(
          { param: { id: 'non-existent-event-id-00001' } },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('404が返ること', () => {
        expect(response.status).toBe(404)
      })
    })
  })
})
