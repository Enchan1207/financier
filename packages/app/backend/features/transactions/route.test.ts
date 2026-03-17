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
import { transactionsTable } from '@backend/schemas/transactions'
import { usersTable } from '@backend/schemas/users'
import { env } from 'cloudflare:test'
import { drizzle } from 'drizzle-orm/d1'
import { testClient } from 'hono/testing'
import { ulid } from 'ulid'

import transactionsRoute from './route'

describe('トランザクションAPI', () => {
  const client = testClient(transactionsRoute, env)
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
    overrides: Partial<{
      id: string
      type: string
      amount: number
      name: string
      transaction_date: string
      event_id: string | null
    }> = {},
  ) => {
    const transaction = {
      id: `txn-${ulid()}`,
      user_id: userId,
      type: 'expense',
      amount: 5000,
      category_id: categoryId,
      event_id: null,
      name: '食料品',
      transaction_date: '2024-04-15',
      created_at: dayjs().toISOString(),
      ...overrides,
    }
    await db.insert(transactionsTable).values(transaction)
    return transaction
  }

  describe('GET /', () => {
    describe('正常系 - トランザクション一覧を取得できる', () => {
      let response: Awaited<ReturnType<typeof client.index.$get>>
      let responseBody: { transactions: unknown[] }

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const category = await insertCategory(userId)
        await insertTransaction(userId, category.id)
        await insertTransaction(userId, category.id, { name: '外食費' })

        response = await client.index.$get(
          {},
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as { transactions: unknown[] }
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('トランザクション一覧が返ること', () => {
        expect(responseBody.transactions).toHaveLength(2)
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

  describe('POST /', () => {
    describe('正常系 - incomeカテゴリにincomeトランザクションを作成できる', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>
      let responseBody: {
        transaction: {
          id: string
          type: string
          amount: number
          categoryId: string
          transactionDate: string
          name: string
          eventId: string | null
          createdAt: string
        }
      }

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const category = await insertCategory(userId, {
          type: 'income',
          name: '給与',
        })

        response = await client.index.$post(
          {
            json: {
              type: 'income',
              amount: 300000,
              categoryId: category.id,
              transactionDate: '2024-04-25',
              name: '4月分給与',
            },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('201が返ること', () => {
        expect(response.status).toBe(201)
      })

      test('typeがincomeであること', () => {
        expect(responseBody.transaction.type).toBe('income')
      })

      test('amountが正しいこと', () => {
        expect(responseBody.transaction.amount).toBe(300000)
      })

      test('nameが正しいこと', () => {
        expect(responseBody.transaction.name).toBe('4月分給与')
      })

      test('transactionDateが正しいこと', () => {
        expect(responseBody.transaction.transactionDate).toBe('2024-04-25')
      })

      test('eventIdがnullであること', () => {
        expect(responseBody.transaction.eventId).toBeNull()
      })

      test('IDが生成されること', () => {
        expect(responseBody.transaction.id).toBeDefined()
      })
    })

    describe('正常系 - expenseカテゴリにexpenseトランザクションを作成できる', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>
      let responseBody: { transaction: { type: string } }

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const category = await insertCategory(userId)

        response = await client.index.$post(
          {
            json: {
              type: 'expense',
              amount: 5000,
              categoryId: category.id,
              transactionDate: '2024-04-15',
              name: '食料品',
            },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('201が返ること', () => {
        expect(response.status).toBe(201)
      })

      test('typeがexpenseであること', () => {
        expect(responseBody.transaction.type).toBe('expense')
      })
    })

    describe('正常系 - savingカテゴリにexpenseトランザクションを作成できる', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>
      let responseBody: { transaction: { type: string } }

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const category = await insertCategory(userId, {
          type: 'saving',
          name: '積立貯金',
          icon: 'piggy_bank',
          color: 'pink',
        })

        response = await client.index.$post(
          {
            json: {
              type: 'expense',
              amount: 10000,
              categoryId: category.id,
              transactionDate: '2024-04-25',
              name: '4月積立',
            },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('201が返ること', () => {
        expect(response.status).toBe(201)
      })

      test('typeがexpenseであること', () => {
        expect(responseBody.transaction.type).toBe('expense')
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>

      beforeAll(async () => {
        response = await client.index.$post({
          json: {
            type: 'expense',
            amount: 1000,
            categoryId: 'any-id',
            transactionDate: '2024-04-01',
            name: 'テスト',
          },
        })
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })

    describe('異常系 - 存在しないカテゴリIDを指定', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>

      beforeAll(async () => {
        const { jwt: sessionJwt } = await setupSession()

        response = await client.index.$post(
          {
            json: {
              type: 'expense',
              amount: 1000,
              categoryId: 'non-existent-category-id-000',
              transactionDate: '2024-04-01',
              name: 'テスト',
            },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('404が返ること', () => {
        expect(response.status).toBe(404)
      })
    })

    describe('異常系 - アーカイブ済みカテゴリへのトランザクション作成', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const category = await insertCategory(userId, { status: 'archived' })

        response = await client.index.$post(
          {
            json: {
              type: 'expense',
              amount: 1000,
              categoryId: category.id,
              transactionDate: '2024-04-01',
              name: 'テスト',
            },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('400が返ること', () => {
        expect(response.status).toBe(400)
      })
    })

    describe('異常系 - カテゴリ種別とトランザクション種別が不一致', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const category = await insertCategory(userId, {
          type: 'income',
          name: '給与',
        })

        response = await client.index.$post(
          {
            json: {
              type: 'expense',
              amount: 1000,
              categoryId: category.id,
              transactionDate: '2024-04-01',
              name: 'テスト',
            },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('400が返ること', () => {
        expect(response.status).toBe(400)
      })
    })

    describe('異常系 - 不正なリクエストボディ（nameが空白のみ）', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const category = await insertCategory(userId)

        response = await client.index.$post(
          {
            json: {
              type: 'expense',
              amount: 1000,
              categoryId: category.id,
              transactionDate: '2024-04-01',
              name: '   ',
            },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('400が返ること', () => {
        expect(response.status).toBe(400)
      })
    })
  })

  describe('PUT /:id', () => {
    describe('正常系 - トランザクションを更新できる', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>
      let responseBody: {
        transaction: {
          amount: number
          name: string
          transactionDate: string
        }
      }

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const category = await insertCategory(userId)
        const transaction = await insertTransaction(userId, category.id)

        response = await client[':id'].$put(
          {
            param: { id: transaction.id },
            json: {
              amount: 8000,
              name: '外食費',
              transactionDate: '2024-05-01',
            },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('amountが更新されること', () => {
        expect(responseBody.transaction.amount).toBe(8000)
      })

      test('nameが更新されること', () => {
        expect(responseBody.transaction.name).toBe('外食費')
      })

      test('transactionDateが更新されること', () => {
        expect(responseBody.transaction.transactionDate).toBe('2024-05-01')
      })
    })

    describe('正常系 - アーカイブ済みカテゴリを持つトランザクションをカテゴリ変更なしで更新できる', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>
      let responseBody: { transaction: { amount: number } }

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const category = await insertCategory(userId, { status: 'archived' })
        const transaction = await insertTransaction(userId, category.id)

        response = await client[':id'].$put(
          {
            param: { id: transaction.id },
            json: { amount: 6000 },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('amountが更新されること', () => {
        expect(responseBody.transaction.amount).toBe(6000)
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>

      beforeAll(async () => {
        response = await client[':id'].$put({
          param: { id: 'any-id' },
          json: { amount: 1000 },
        })
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })

    describe('異常系 - 存在しないトランザクションIDを指定', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>

      beforeAll(async () => {
        const { jwt: sessionJwt } = await setupSession()

        response = await client[':id'].$put(
          {
            param: { id: 'non-existent-transaction-id-0' },
            json: { amount: 1000 },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('404が返ること', () => {
        expect(response.status).toBe(404)
      })
    })

    describe('異常系 - 変更先カテゴリがアーカイブ済み', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const activeCategory = await insertCategory(userId)
        const archivedCategory = await insertCategory(userId, {
          status: 'archived',
        })
        const transaction = await insertTransaction(userId, activeCategory.id)

        response = await client[':id'].$put(
          {
            param: { id: transaction.id },
            json: { categoryId: archivedCategory.id },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('400が返ること', () => {
        expect(response.status).toBe(400)
      })
    })
  })

  describe('DELETE /:id', () => {
    describe('正常系 - トランザクションを削除できる', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$delete']>>
      let responseBody: { transaction: { id: string } }

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()
        const category = await insertCategory(userId)
        const transaction = await insertTransaction(userId, category.id)

        response = await client[':id'].$delete(
          { param: { id: transaction.id } },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('削除されたトランザクションのIDが返ること', () => {
        expect(responseBody.transaction.id).toBeDefined()
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

    describe('異常系 - 存在しないトランザクションIDを指定', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$delete']>>

      beforeAll(async () => {
        const { jwt: sessionJwt } = await setupSession()

        response = await client[':id'].$delete(
          { param: { id: 'non-existent-transaction-id-0' } },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('404が返ること', () => {
        expect(response.status).toBe(404)
      })
    })
  })
})
