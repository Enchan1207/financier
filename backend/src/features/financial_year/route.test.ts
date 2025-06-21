import { env, fetchMock } from 'cloudflare:test'
import type { InferResponseType } from 'hono'
import { sign } from 'hono/jwt'
import { testClient } from 'hono/testing'

import { saveUser } from '@/dao/authorize'
import type { FinancialYearValue } from '@/domains/financial_year'
import { createFinancialYear } from '@/domains/financial_year/logic'
import { createStandardIncomeTable } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'

import { insertStandardIncomeTable } from '../standard_income/dao'
import { getFinancialYear, insertFinancialYear } from './dao'
import financial_years from './route'

describe('会計年度API', () => {
  const client = testClient(financial_years, env)

  const dummyUser: User = createUser({
    name: 'test user',
    email: 'test@example.com',
    auth0UserId: 'test_user',
  })

  let token: string

  const dummyStandardIncomeTable = createStandardIncomeTable({
    userId: dummyUser.id,
    name: 'テスト',
    grades: [
      {
        threshold: 0,
        standardIncome: 10000,
      },
    ],
  })._unsafeUnwrap()

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    financialYear: 2025,
    standardIncomeTableId: dummyStandardIncomeTable.id,
  })._unsafeUnwrap()

  beforeAll(async () => {
    token = await sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        iss: `https://${env.AUTH_DOMAIN}/`,
        sub: dummyUser.auth0UserId,
        aud: [env.AUTH_AUDIENCE],
      },
      env.TEST_PRIVATE_KEY,
      'RS256',
    )

    // テストユーザとテスト用財務年度を登録
    await saveUser(env.D1)(dummyUser)
    await insertStandardIncomeTable(env.D1)(dummyStandardIncomeTable)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
  })

  afterEach(() => {
    fetchMock.assertNoPendingInterceptors()
  })

  test('単一の財務年度を取得できること', async () => {
    const result = await client[':year'].$get(
      {
        param: { year: dummyFinancialYear.year.toString() },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    const stored = await result.json()
    expect(stored).toStrictEqual(dummyFinancialYear)
  })

  test('複数の財務年度を取得できること', async () => {
    const anotherYear = createFinancialYear({
      userId: dummyUser.id,
      financialYear: 2026,
      standardIncomeTableId: dummyStandardIncomeTable.id,
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
        param: {
          year: input.year.toString(),
        },
        json: {
          standardIncomeTableId: dummyStandardIncomeTable.id,
        },
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
      userId: dummyUser.id,
      financialYear: input.year as FinancialYearValue,
    })
    expect(stored).toStrictEqual(created)
  })

  test('特定の財務月を取得できること', async () => {
    const result = await client[':financialYear'][':month'].$get(
      {
        param: {
          financialYear: dummyFinancialYear.year.toString(),
          month: '6',
        },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    const expected = dummyFinancialYear.months.find(
      ({ info: { month } }) => month === 6,
    )

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
          sub: dummyUser.auth0UserId,
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

      const expected = dummyFinancialYear.months.find(
        ({ info: { month } }) => month === 6,
      )
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
          sub: dummyUser.auth0UserId,
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
