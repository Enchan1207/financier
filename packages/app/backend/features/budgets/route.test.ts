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
import { usersTable } from '@backend/schemas/users'
import { env } from 'cloudflare:test'
import { drizzle } from 'drizzle-orm/d1'
import { testClient } from 'hono/testing'
import { ulid } from 'ulid'

import budgetsRoute from './route'

describe('予算API', () => {
  const client = testClient(budgetsRoute, env)
  const db = drizzle(env.D1)

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(dayjs('2026-04-01T10:00:00Z').toDate())
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
    type: 'income' | 'expense' | 'saving' = 'income',
  ) => {
    const category = {
      id: `cat-${ulid()}`,
      user_id: userId,
      type,
      name: type === 'income' ? '給与' : '食費',
      icon: type === 'income' ? 'briefcase' : 'utensils',
      color: type === 'income' ? 'green' : 'red',
    }
    await db.insert(categoriesTable).values(category)
    return category
  }

  const insertFiscalYear = async (
    userId: string,
    year: number,
    status: 'active' | 'closed' = 'active',
  ) => {
    const fiscalYear = {
      id: `fy-${ulid()}`,
      user_id: userId,
      year,
      status,
    }
    await db.insert(fiscalYearsTable).values(fiscalYear)
    return fiscalYear
  }

  const insertBudget = async (
    userId: string,
    fiscalYearId: string,
    categoryId: string,
    budgetAmount: number,
  ) => {
    await db.insert(budgetsTable).values({
      user_id: userId,
      fiscal_year_id: fiscalYearId,
      category_id: categoryId,
      budget_amount: budgetAmount,
    })
  }

  describe('POST /', () => {
    describe('正常系 - 年度予算を新規作成できる（FiscalYearが存在しない場合）', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>
      let responseBody: {
        fiscalYear: { year: number; status: string }
        items: { categoryId: string; budgetAmount: number }[]
      }

      beforeAll(async () => {
        const { jwt, userId } = await setupSession()
        const incomeCategory = await insertCategory(userId, 'income')
        const expenseCategory = await insertCategory(userId, 'expense')

        response = await client.index.$post(
          {
            json: {
              year: 2025,
              items: [
                { categoryId: incomeCategory.id, budgetAmount: 300000 },
                { categoryId: expenseCategory.id, budgetAmount: 200000 },
              ],
            },
          },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('201が返ること', () => {
        expect(response.status).toBe(201)
      })

      test('年度が正しいこと', () => {
        expect(responseBody.fiscalYear.year).toBe(2025)
      })

      test('年度のstatusがactiveであること', () => {
        expect(responseBody.fiscalYear.status).toBe('active')
      })

      test('予算項目が2件返ること', () => {
        expect(responseBody.items).toHaveLength(2)
      })
    })

    describe('異常系 - 支出予算が収入予算を超える場合は400が返る', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>

      beforeAll(async () => {
        const { jwt, userId } = await setupSession()
        const incomeCategory = await insertCategory(userId, 'income')
        const expenseCategory = await insertCategory(userId, 'expense')

        response = await client.index.$post(
          {
            json: {
              year: 2025,
              items: [
                { categoryId: incomeCategory.id, budgetAmount: 100000 },
                { categoryId: expenseCategory.id, budgetAmount: 200000 },
              ],
            },
          },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
      })

      test('400が返ること', () => {
        expect(response.status).toBe(400)
      })
    })

    describe('異常系 - 締め済み年度への作成は409が返る', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>

      beforeAll(async () => {
        const { jwt, userId } = await setupSession()
        await insertFiscalYear(userId, 2024, 'closed')
        const incomeCategory = await insertCategory(userId, 'income')

        response = await client.index.$post(
          {
            json: {
              year: 2024,
              items: [{ categoryId: incomeCategory.id, budgetAmount: 300000 }],
            },
          },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
      })

      test('409が返ること', () => {
        expect(response.status).toBe(409)
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>

      beforeAll(async () => {
        response = await client.index.$post({
          json: { year: 2026, items: [] },
        })
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })
  })

  describe('PUT /:year', () => {
    describe('正常系 - 年度予算を一括更新できる', () => {
      let response: Awaited<ReturnType<(typeof client)[':year']['$put']>>
      let responseBody: {
        fiscalYear: { year: number }
        items: { categoryId: string; budgetAmount: number }[]
      }

      beforeAll(async () => {
        const { jwt, userId } = await setupSession()
        const incomeCategory = await insertCategory(userId, 'income')
        const expenseCategory = await insertCategory(userId, 'expense')
        const fy = await insertFiscalYear(userId, 2026)
        await insertBudget(userId, fy.id, incomeCategory.id, 200000)

        response = await client[':year'].$put(
          {
            param: { year: '2026' },
            json: {
              items: [
                { categoryId: incomeCategory.id, budgetAmount: 400000 },
                { categoryId: expenseCategory.id, budgetAmount: 300000 },
              ],
            },
          },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('予算項目が2件返ること', () => {
        expect(responseBody.items).toHaveLength(2)
      })
    })
  })

  describe('PUT /:year/items/:categoryId', () => {
    describe('正常系 - カテゴリ予算を更新できる', () => {
      let response: Awaited<
        ReturnType<(typeof client)[':year']['items'][':categoryId']['$put']>
      >
      let responseBody: {
        items: { categoryId: string; budgetAmount: number }[]
      }

      beforeAll(async () => {
        const { jwt, userId } = await setupSession()
        const incomeCategory = await insertCategory(userId, 'income')
        const expenseCategory = await insertCategory(userId, 'expense')
        const fy = await insertFiscalYear(userId, 2026)
        await insertBudget(userId, fy.id, incomeCategory.id, 300000)
        await insertBudget(userId, fy.id, expenseCategory.id, 100000)

        response = await client[':year']['items'][':categoryId'].$put(
          {
            param: { year: '2026', categoryId: expenseCategory.id },
            json: { budgetAmount: 200000 },
          },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('更新後の予算項目が含まれること', () => {
        expect(responseBody.items).toHaveLength(1)
      })

      test('更新後の予算金額が正しいこと', () => {
        expect(responseBody.items[0]?.budgetAmount).toBe(200000)
      })
    })

    describe('異常系 - 存在しない予算アイテムは404が返る', () => {
      let response: Awaited<
        ReturnType<(typeof client)[':year']['items'][':categoryId']['$put']>
      >

      beforeAll(async () => {
        const { jwt, userId } = await setupSession()
        const incomeCategory = await insertCategory(userId, 'income')
        await insertFiscalYear(userId, 2026)

        response = await client[':year']['items'][':categoryId'].$put(
          {
            param: { year: '2026', categoryId: incomeCategory.id },
            json: { budgetAmount: 300000 },
          },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
      })

      test('404が返ること', () => {
        expect(response.status).toBe(404)
      })
    })
  })

  describe('POST /:year/close', () => {
    describe('正常系 - 年度を締めることができる', () => {
      let response: Awaited<
        ReturnType<(typeof client)[':year']['close']['$post']>
      >
      let responseBody: { fiscalYear: { status: string } }

      beforeAll(async () => {
        const { jwt, userId } = await setupSession()
        await insertFiscalYear(userId, 2026)

        response = await client[':year']['close'].$post(
          { param: { year: '2026' } },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('年度のstatusがclosedになること', () => {
        expect(responseBody.fiscalYear.status).toBe('closed')
      })
    })

    describe('異常系 - 存在しない年度は404が返る', () => {
      let response: Awaited<
        ReturnType<(typeof client)[':year']['close']['$post']>
      >

      beforeAll(async () => {
        const { jwt } = await setupSession()

        response = await client[':year']['close'].$post(
          { param: { year: '2099' } },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
      })

      test('404が返ること', () => {
        expect(response.status).toBe(404)
      })
    })
  })
})
