import { env } from 'cloudflare:test'
import type { InferResponseType } from 'hono'
import { sign } from 'hono/jwt'
import { testClient } from 'hono/testing'

import type { FinancialMonthData } from '@/domains/financial_month'
import { createFinancialMonthData } from '@/domains/financial_month/logic'
import { createFinancialYear } from '@/domains/financial_year/logic'
import { createIncomeDefinition } from '@/domains/income_definition/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import { saveUser } from '@/features/authorize/dao'
import { insertFinancialYear } from '@/features/financial_year/dao'

import { insertIncomeDefinition } from './dao'
import incomeDefinitions from './route'

describe('報酬定義API', () => {
  const client = testClient(incomeDefinitions, env)

  const testUser: User = createUser({
    name: 'test user',
    email: 'test@example.com',
    auth0UserId: 'test_user',
  })

  const testFinancialYear = createFinancialYear({
    userId: testUser.id,
    year: 2025,
  })._unsafeUnwrap()

  const testStartMonth: FinancialMonthData = createFinancialMonthData({
    financialYear: 2025,
    month: 4,
    workday: 20,
  })._unsafeUnwrap()

  const testEndMonth: FinancialMonthData = createFinancialMonthData({
    financialYear: 2025,
    month: 12,
    workday: 20,
  })._unsafeUnwrap()

  const testDefinition = createIncomeDefinition({
    userId: testUser.id,
    name: 'test allowance',
    kind: 'absolute',
    value: 100000,
    isTaxable: true,
    from: testStartMonth,
    to: testEndMonth,
  })._unsafeUnwrap()

  let token: string

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

    await saveUser(env.D1)(testUser)
    await insertFinancialYear(env.D1)(testFinancialYear)
    await insertIncomeDefinition(env.D1)(testDefinition)
  })

  describe('収入定義一覧の取得', () => {
    let actual: Awaited<ReturnType<typeof client.index.$get>>

    beforeAll(async () => {
      actual = await client.index.$get(
        {
          query: { order: 'asc' },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
    })

    test('200が返ること', () => {
      expect(actual.status).toBe(200)
    })

    test('配列が返ること', async () => {
      const result = await actual.json()
      expect(Array.isArray(result)).toBe(true)
    })

    test('定義が含まれていること', async () => {
      const result = (await actual.json()) as InferResponseType<
        typeof client.index.$get,
        200
      >
      expect(result.some(({ id }) => id === testDefinition.id)).toBe(true)
    })
  })

  describe('収入定義の個別取得', () => {
    describe('正常系', () => {
      let actual: Awaited<ReturnType<(typeof client)[':id']['$get']>>

      beforeAll(async () => {
        actual = await client[':id'].$get(
          {
            param: { id: testDefinition.id },
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )
      })

      test('200が返ること', () => {
        expect(actual.status).toBe(200)
      })

      test('定義が返ること', async () => {
        const result = (await actual.json()) as InferResponseType<
          (typeof client)[':id']['$get'],
          200
        >
        expect(result.id).toBe(testDefinition.id)
      })
    })

    describe('異常系 - 存在しないID', () => {
      let actual: Awaited<ReturnType<(typeof client)[':id']['$get']>>

      beforeAll(async () => {
        actual = await client[':id'].$get(
          {
            param: { id: 'invalid_id' },
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )
      })

      test('400が返ること', () => {
        expect(actual.status).toBe(400)
      })
    })
  })

  describe('収入定義の作成', () => {
    describe('正常系', () => {
      let actual: Awaited<ReturnType<typeof client.index.$post>>

      const input = {
        name: 'new allowance',
        kind: 'absolute',
        value: 50000,
        isTaxable: true,
        from: testStartMonth,
        to: testEndMonth,
      } as const

      beforeAll(async () => {
        actual = await client.index.$post(
          { json: input },
          { headers: { Authorization: `Bearer ${token}` } },
        )
      })

      test('201が返ること', () => {
        expect(actual.status).toBe(201)
      })

      test('入力した内容で定義が作成されること', async () => {
        const result = (await actual.json()) as InferResponseType<
          typeof client.index.$post,
          201
        >

        expect(result.name).toBe(input.name)
        expect(result.kind).toBe(input.kind)
        expect(result.value).toBe(input.value)
        expect(result.isTaxable).toBe(input.isTaxable)
      })
    })

    describe('異常系 - バリデーションエラー', () => {
      let actual: Awaited<ReturnType<typeof client.index.$post>>

      beforeAll(async () => {
        actual = await client.index.$post(
          {
            json: {
              name: 'test',
              kind: 'absolute',
              value: 0,
              isTaxable: true,
              from: testEndMonth,
              to: testStartMonth,
            },
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )
      })

      test('400が返ること', () => {
        expect(actual.status).toBe(400)
      })
    })
  })

  describe('収入定義の更新', () => {
    describe('正常系', () => {
      let actual: Awaited<ReturnType<(typeof client)[':id']['$put']>>

      const input = {
        name: 'updated allowance',
        kind: 'related_by_workday',
        value: 5000,
        isTaxable: false,
      }

      beforeAll(async () => {
        actual = await client[':id'].$put(
          {
            param: { id: testDefinition.id },
            json: input,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )
      })

      test('200が返ること', () => {
        expect(actual.status).toBe(200)
      })

      test('入力した内容で定義が更新されること', async () => {
        const result = (await actual.json()) as InferResponseType<
          (typeof client)[':id']['$put'],
          200
        >

        expect(result.name).toBe(input.name)
        expect(result.kind).toBe(input.kind)
        expect(result.value).toBe(input.value)
        expect(result.isTaxable).toBe(input.isTaxable)
      })
    })

    describe('異常系 - 存在しないID', () => {
      let actual: Awaited<ReturnType<(typeof client)[':id']['$put']>>

      beforeAll(async () => {
        actual = await client[':id'].$put(
          {
            query: { id: 'invalid_id' },
            param: {
              id: '',
            },
            json: {
              name: 'should not update',
            },
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )
      })

      test('404が返ること', () => {
        expect(actual.status).toBe(404)
      })
    })

    describe('異常系 - バリデーションエラー', () => {
      let actual: Awaited<ReturnType<(typeof client)[':id']['$put']>>

      beforeAll(async () => {
        actual = await client[':id'].$put(
          {
            query: { id: testDefinition.id },
            param: { id: testDefinition.id },
            json: {
              value: -1,
            },
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )
      })

      test('400が返ること', () => {
        expect(actual.status).toBe(400)
      })
    })
  })
})
