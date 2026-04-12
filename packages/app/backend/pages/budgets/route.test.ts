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

import budgetsPageRoute from './route'

describe('予算ページAPI', () => {
  const client = testClient(budgetsPageRoute, env)
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

  const insertTransaction = async (
    userId: string,
    categoryId: string,
    amount: number,
    transactionDate: string,
  ) => {
    await db.insert(transactionsTable).values({
      id: `txn-${ulid()}`,
      user_id: userId,
      type: 'expense',
      amount,
      category_id: categoryId,
      event_id: null,
      name: 'テスト取引',
      transaction_date: transactionDate,
      created_at: dayjs().toISOString(),
    })
  }

  describe('GET /:year', () => {
    describe('正常系 - 年度予算と実績を取得できる', () => {
      let response: Awaited<ReturnType<(typeof client)[':year']['$get']>>
      let responseBody: {
        fiscalYear: { year: number; status: string }
        items: {
          categoryId: string
          budgetAmount: number
          annualActual: number
          monthlyActuals: { month: number; actual: number }[]
        }[]
        warnings: { exceedsBudget: boolean }
      }

      beforeAll(async () => {
        const { jwt, userId } = await setupSession()
        const incomeCategory = await insertCategory(userId, 'income')
        const expenseCategory = await insertCategory(userId, 'expense')
        const fy = await insertFiscalYear(userId, 2026)
        await insertBudget(userId, fy.id, incomeCategory.id, 300000)
        await insertBudget(userId, fy.id, expenseCategory.id, 200000)

        await insertTransaction(userId, expenseCategory.id, 50000, '2026-04-15')
        await insertTransaction(userId, expenseCategory.id, 30000, '2026-05-10')

        response = await client[':year'].$get(
          { param: { year: '2026' } },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('年度情報が含まれること', () => {
        expect(responseBody.fiscalYear.year).toBe(2026)
      })

      test('予算項目が2件含まれること', () => {
        expect(responseBody.items).toHaveLength(2)
      })

      test('支出カテゴリの年次実績が正しいこと', () => {
        const expenseItem = responseBody.items.find(
          (item) => item.budgetAmount === 200000,
        )
        expect(expenseItem?.annualActual).toBe(80000)
      })

      test('月次実績が12ヶ月分含まれること', () => {
        const expenseItem = responseBody.items.find(
          (item) => item.budgetAmount === 200000,
        )
        expect(expenseItem?.monthlyActuals).toHaveLength(12)
      })

      test('警告フラグが含まれること', () => {
        expect(responseBody.warnings).toBeDefined()
      })

      test('支出予算が収入予算を超えていないこと', () => {
        expect(responseBody.warnings.exceedsBudget).toBe(false)
      })
    })

    describe('異常系 - 存在しない年度は404が返る', () => {
      let response: Awaited<ReturnType<(typeof client)[':year']['$get']>>

      beforeAll(async () => {
        const { jwt } = await setupSession()

        response = await client[':year'].$get(
          { param: { year: '2099' } },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
      })

      test('404が返ること', () => {
        expect(response.status).toBe(404)
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<(typeof client)[':year']['$get']>>

      beforeAll(async () => {
        response = await client[':year'].$get({ param: { year: '2026' } })
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })
  })
})
