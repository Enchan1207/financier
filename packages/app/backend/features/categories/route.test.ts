import { createSession } from '@backend/domains/session'
import { createUser } from '@backend/domains/user'
import { signSessionJwt } from '@backend/features/session/jwt'
import dayjs from '@backend/lib/date'
import {
  SESSION_COOKIE_AGE,
  SESSION_JWT_AGE,
} from '@backend/lib/session-config'
import { budgetsTable } from '@backend/schemas/budgets'
import { categoriesTable } from '@backend/schemas/categories'
import { fiscalYearsTable } from '@backend/schemas/fiscal-years'
import { sessionsTable } from '@backend/schemas/sessions'
import { transactionsTable } from '@backend/schemas/transactions'
import { usersTable } from '@backend/schemas/users'
import { env } from 'cloudflare:test'
import { drizzle } from 'drizzle-orm/d1'
import { testClient } from 'hono/testing'
import { ulid } from 'ulid'

import categoriesRoute from './route'

describe('カテゴリAPI', () => {
  const client = testClient(categoriesRoute, env)
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

  describe('POST /', () => {
    describe('正常系 - incomeカテゴリを作成できる', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>
      let responseBody: {
        category: {
          id: string
          type: string
          name: string
          icon: string
          color: string
        }
      }

      beforeAll(async () => {
        const { jwt: sessionJwt } = await setupSession()

        response = await client.index.$post(
          {
            json: {
              type: 'income',
              name: '副業収入',
              icon: 'wallet',
              color: 'blue',
            },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('201が返ること', () => {
        expect(response.status).toBe(201)
      })

      test('作成されたカテゴリのtypeがincomeであること', () => {
        expect(responseBody.category.type).toBe('income')
      })

      test('作成されたカテゴリのnameが正しいこと', () => {
        expect(responseBody.category.name).toBe('副業収入')
      })

      test('作成されたカテゴリのIDが存在すること', () => {
        expect(responseBody.category.id).toBeDefined()
      })

      test('statusフィールドが含まれないこと', () => {
        expect(responseBody.category).not.toHaveProperty('status')
      })
    })

    describe('正常系 - expenseカテゴリを作成できる', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>
      let responseBody: { category: { type: string } }

      beforeAll(async () => {
        const { jwt: sessionJwt } = await setupSession()

        response = await client.index.$post(
          {
            json: {
              type: 'expense',
              name: '交通費',
              icon: 'bus',
              color: 'yellow',
            },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('201が返ること', () => {
        expect(response.status).toBe(201)
      })

      test('作成されたカテゴリのtypeがexpenseであること', () => {
        expect(responseBody.category.type).toBe('expense')
      })
    })

    describe('正常系 - savingカテゴリを作成できる', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>
      let responseBody: { category: { type: string } }

      beforeAll(async () => {
        const { jwt: sessionJwt } = await setupSession()

        response = await client.index.$post(
          {
            json: {
              type: 'saving',
              name: '積立貯金',
              icon: 'piggy_bank',
              color: 'pink',
            },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('201が返ること', () => {
        expect(response.status).toBe(201)
      })

      test('作成されたカテゴリのtypeがsavingであること', () => {
        expect(responseBody.category.type).toBe('saving')
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>

      beforeAll(async () => {
        response = await client.index.$post({
          json: {
            type: 'income',
            name: '給与',
            icon: 'briefcase',
            color: 'green',
          },
        })
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })

    describe('異常系 - 不正なリクエストボディ（nameが空）', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>

      beforeAll(async () => {
        const { jwt: sessionJwt } = await setupSession()

        response = await client.index.$post(
          {
            json: {
              type: 'income',
              name: '   ',
              icon: 'briefcase',
              color: 'green',
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
    describe('正常系 - カテゴリを更新できる', () => {
      const categoryId = 'test-category-id-put-000001'
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>
      let responseBody: {
        category: {
          id: string
          name: string
          icon: string
          color: string
        }
      }

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()

        await db.insert(categoriesTable).values({
          id: categoryId,
          user_id: userId,
          type: 'expense',
          name: '食費',
          icon: 'utensils',
          color: 'red',
        })

        response = await client[':id'].$put(
          {
            param: { id: categoryId },
            json: { name: '外食費', icon: 'coffee', color: 'orange' },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('nameが更新されること', () => {
        expect(responseBody.category.name).toBe('外食費')
      })

      test('iconが更新されること', () => {
        expect(responseBody.category.icon).toBe('coffee')
      })

      test('colorが更新されること', () => {
        expect(responseBody.category.color).toBe('orange')
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>

      beforeAll(async () => {
        response = await client[':id'].$put({
          param: { id: 'any-id' },
          json: { name: '更新', icon: 'tag', color: 'blue' },
        })
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })

    describe('異常系 - 存在しないカテゴリIDを指定', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>

      beforeAll(async () => {
        const { jwt: sessionJwt } = await setupSession()

        response = await client[':id'].$put(
          {
            param: { id: 'non-existent-category-id-000' },
            json: { name: '更新', icon: 'tag', color: 'blue' },
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
    describe('正常系 - 参照のないカテゴリを削除できる', () => {
      const categoryId = 'test-category-id-del-000001'
      let response: Awaited<ReturnType<(typeof client)[':id']['$delete']>>

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()

        await db.insert(categoriesTable).values({
          id: categoryId,
          user_id: userId,
          type: 'saving',
          name: '積立貯金',
          icon: 'piggy_bank',
          color: 'pink',
        })

        response = await client[':id'].$delete(
          { param: { id: categoryId } },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('204が返ること', () => {
        expect(response.status).toBe(204)
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

    describe('異常系 - 存在しないカテゴリIDを指定', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$delete']>>

      beforeAll(async () => {
        const { jwt: sessionJwt } = await setupSession()

        response = await client[':id'].$delete(
          { param: { id: 'non-existent-category-id-000' } },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('404が返ること', () => {
        expect(response.status).toBe(404)
      })
    })

    describe('異常系 - トランザクションから参照されているカテゴリは削除できない', () => {
      const categoryId = 'test-category-id-del-000002'
      let response: Awaited<ReturnType<(typeof client)[':id']['$delete']>>

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()

        await db.insert(categoriesTable).values({
          id: categoryId,
          user_id: userId,
          type: 'expense',
          name: '食費',
          icon: 'utensils',
          color: 'red',
        })

        await db.insert(transactionsTable).values({
          id: ulid(),
          user_id: userId,
          type: 'expense',
          amount: 1000,
          category_id: categoryId,
          name: 'ランチ',
          transaction_date: '2022-11-01',
          created_at: dayjs().toISOString(),
        })

        response = await client[':id'].$delete(
          { param: { id: categoryId } },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('409が返ること', () => {
        expect(response.status).toBe(409)
      })
    })

    describe('異常系 - 予算から参照されているカテゴリは削除できない', () => {
      const categoryId = 'test-category-id-del-000003'
      let response: Awaited<ReturnType<(typeof client)[':id']['$delete']>>

      beforeAll(async () => {
        const { jwt: sessionJwt, userId } = await setupSession()

        await db.insert(categoriesTable).values({
          id: categoryId,
          user_id: userId,
          type: 'expense',
          name: '交際費',
          icon: 'gift',
          color: 'purple',
        })

        const fiscalYearId = ulid()
        await db.insert(fiscalYearsTable).values({
          id: fiscalYearId,
          user_id: userId,
          year: 2022,
          status: 'active',
        })

        await db.insert(budgetsTable).values({
          user_id: userId,
          fiscal_year_id: fiscalYearId,
          category_id: categoryId,
          budget_amount: 50000,
        })

        response = await client[':id'].$delete(
          { param: { id: categoryId } },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('409が返ること', () => {
        expect(response.status).toBe(409)
      })
    })
  })
})
