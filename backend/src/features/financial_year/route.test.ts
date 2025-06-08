import { env, fetchMock } from 'cloudflare:test'
import type { InferResponseType } from 'hono'
import { sign } from 'hono/jwt'
import { testClient } from 'hono/testing'

import type { FinancialYearValue } from '@/domains/financial_year'
import { createFinancialYear } from '@/domains/financial_year/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'

import { saveUser } from '../authorize/dao'
import { getFinancialYear, insertFinancialYear } from './dao'
import financial_years from './route'

describe('財務年度API', () => {
  const client = testClient(financial_years, env)

  const testUser: User = createUser({
    name: 'test user',
    email: 'test@example.com',
    auth0UserId: 'test_user',
  })

  let token: string

  const testYear = createFinancialYear({
    userId: testUser.id,
    year: 2025,
  })._unsafeUnwrap()

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

    // テストユーザとテスト用財務年度を登録
    await saveUser(env.D1)(testUser)
    await insertFinancialYear(env.D1)(testYear)
  })

  afterEach(() => {
    fetchMock.assertNoPendingInterceptors()
  })

  test('単一の財務年度を取得できること', async () => {
    const result = await client[':year'].$get(
      {
        param: { year: testYear.year.toString() },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    const stored = await result.json()
    expect(stored).toStrictEqual(testYear)
  })

  test('複数の財務年度を取得できること', async () => {
    const anotherYear = createFinancialYear({
      userId: testUser.id,
      year: 2026,
    })._unsafeUnwrap()
    await insertFinancialYear(env.D1)(anotherYear)

    const result = await client.index.$get(
      { query: { order: 'asc' } },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    const stored = await result.json()
    expect(stored).toStrictEqual([2025, 2026])
  })

  test('新規に財務年度を作成できること', async () => {
    const input = { year: 2026 }

    const result = await client[':year'].$post(
      {
        param: { year: input.year.toString() },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    expect(result.status).toBe(201)
    const created = (await result.json()) as InferResponseType<
      (typeof client)[':year']['$post'],
      201
    >
    expect(created.year).toBe(input.year)

    const stored = await getFinancialYear(env.D1)({
      userId: testUser.id,
      financialYear: input.year as FinancialYearValue,
    })
    expect(stored).toStrictEqual(created)
  })

  test('特定の財務月を取得できること', async () => {
    const result = await client[':financialYear'][':month'].$get(
      {
        param: {
          financialYear: testYear.year.toString(),
          month: '6',
        },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    const expected = testYear.months.find(({ month }) => month === 6)

    const stored = await result.json()
    expect(stored).toStrictEqual(expected)
  })

  describe('現在の財務月が存在する場合は取得できること', () => {
    let actual: Awaited<ReturnType<typeof client.current.$get>>

    beforeAll(async () => {
      vi.useFakeTimers()
      vi.setSystemTime('2025-06-01T00:00:00Z')

      // ここはシステム時刻をいじるので、トークンを別で生成する
      const token = await sign(
        {
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
          iss: `https://${env.AUTH_DOMAIN}/`,
          sub: testUser.auth0UserId,
          aud: [env.AUTH_AUDIENCE],
        },
        env.TEST_PRIVATE_KEY,
        'RS256',
      )

      actual = await client['current'].$get(undefined, {
        headers: { Authorization: `Bearer ${token}` },
      })
    })

    afterAll(() => {
      vi.useRealTimers()
    })

    test('200が返ること', () => {
      expect(actual.status).toBe(200)
    })

    test('現在の財務月を取得できること', async () => {
      const stored = (await actual.json()) as InferResponseType<
        typeof client.current.$get,
        200
      >

      const expected = testYear.months.find(({ month }) => month === 6)
      expect(stored).toStrictEqual(expected)
    })
  })

  describe('現在の財務月が存在しない場合は取得できないこと', () => {
    let actual: Awaited<ReturnType<typeof client.current.$get>>

    beforeAll(async () => {
      vi.useFakeTimers()
      vi.setSystemTime('2026-06-01T00:00:00Z')

      // ここはシステム時刻をいじるので、トークンを別で生成する
      const token = await sign(
        {
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
          iss: `https://${env.AUTH_DOMAIN}/`,
          sub: testUser.auth0UserId,
          aud: [env.AUTH_AUDIENCE],
        },
        env.TEST_PRIVATE_KEY,
        'RS256',
      )

      actual = await client['current'].$get(undefined, {
        headers: { Authorization: `Bearer ${token}` },
      })
    })

    afterAll(() => {
      vi.useRealTimers()
    })

    test('404が返ること', () => {
      expect(actual.status).toBe(404)
    })
  })
})
