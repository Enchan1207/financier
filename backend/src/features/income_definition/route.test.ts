import { env } from 'cloudflare:test'
import type { InferResponseType } from 'hono'
import { sign } from 'hono/jwt'
import { testClient } from 'hono/testing'
import { ulid } from 'ulid'

import { createFinancialYear } from '@/domains/financial_year/logic'
import { createIncomeDefinition } from '@/domains/income_definition/logic'
import { createStandardIncomeTable } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import { saveUser } from '@/features/authorize/dao'
import { insertFinancialYear } from '@/features/financial_year/dao'

import { insertStandardIncomeTable } from '../standard_income/dao'
import { insertIncomeDefinition } from './dao'
import incomeDefinitions from './route'
import type { PutIncomeDefinitionCommand } from './workflow/put'

describe('報酬定義API', () => {
  const client = testClient(incomeDefinitions, env)

  const dummyUser: User = createUser({
    name: 'test user',
    email: 'test@example.com',
    auth0UserId: 'test_user',
  })

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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyMay = dummyFinancialYear.months.find(
    ({ info: { month } }) => month === 5,
  )!

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyNovember = dummyFinancialYear.months.find(
    ({ info: { month } }) => month === 11,
  )!

  const dummyDefinition = createIncomeDefinition({
    userId: dummyUser.id,
    name: 'test allowance',
    kind: 'absolute',
    value: 100000,
    isTaxable: true,
    from: dummyMay.info,
    to: dummyNovember.info,
  })._unsafeUnwrap()

  let token: string

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

    await saveUser(env.D1)(dummyUser)
    await insertStandardIncomeTable(env.D1)(dummyStandardIncomeTable)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
    await insertIncomeDefinition(env.D1)(dummyDefinition)
  })

  describe('収入定義一覧の取得', () => {
    let actual: Awaited<ReturnType<typeof client.index.$get>>

    beforeAll(async () => {
      actual = await client.index.$get(
        {
          query: {
            order: 'asc',
            at: '2025_06',
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
    })

    test('200が返ること', () => {
      expect(actual.status).toBe(200)
    })

    test('定義の配列が得られること', async () => {
      const result = (await actual.json()) as InferResponseType<
        typeof client.index.$get,
        200
      >

      const expected = {
        ...dummyDefinition,
        enabledAt: dummyDefinition.enabledAt.toISOString(),
        disabledAt: dummyDefinition.disabledAt.toISOString(),
        updatedAt: dummyDefinition.updatedAt.toISOString(),
      }

      expect(result).toStrictEqual([expected])
    })
  })

  describe('収入定義の個別取得', () => {
    describe('正常系', () => {
      let actual: Awaited<ReturnType<(typeof client)[':id']['$get']>>

      beforeAll(async () => {
        actual = await client[':id'].$get(
          {
            param: { id: dummyDefinition.id },
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )
      })

      test('200が返ること', () => {
        expect(actual.status).toBe(200)
      })

      test('定義が返ること', async () => {
        const result = await actual.json()
        const expected = {
          ...dummyDefinition,
          enabledAt: dummyDefinition.enabledAt.toISOString(),
          disabledAt: dummyDefinition.disabledAt.toISOString(),
          updatedAt: dummyDefinition.updatedAt.toISOString(),
        }

        expect(result).toStrictEqual(expected)
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
        from: dummyMay.info,
        to: dummyNovember.info,
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
              from: dummyNovember.info,
              to: dummyMay.info,
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

      const input: PutIncomeDefinitionCommand['input'] = {
        name: 'updated allowance',
        kind: 'related_by_workday',
        value: 5000,
        isTaxable: false,
      }

      beforeAll(async () => {
        actual = await client[':id'].$put(
          {
            param: { id: dummyDefinition.id },
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
            param: {
              id: ulid(),
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
            param: { id: dummyDefinition.id },
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
