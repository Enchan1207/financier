import { env, fetchMock } from 'cloudflare:test'
import type { InferResponseType } from 'hono'
import { sign } from 'hono/jwt'
import { testClient } from 'hono/testing'

import { createStandardIncomeGrade, createStandardIncomeTable } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'

import { saveUser } from '../authorize/dao'
import { getStandardIncomeTable, insertStandardIncomeTable } from './dao'
import standard_incomes from './route'

describe('標準報酬月額表API', () => {
  const client = testClient(standard_incomes, env)

  const testUser: User = createUser({
    name: 'test user',
    email: 'test@example.com',
    auth0UserId: 'test_user',
  })

  let token: string
  const testTable = createStandardIncomeTable({
    userId: testUser.id,
    name: 'テスト用月額表',
    grades: [
      {
        threshold: 0,
        standardIncome: 88000,
      },
      {
        threshold: 93000,
        standardIncome: 98000,
      },
      {
        threshold: 101000,
        standardIncome: 104000,
      },
    ],
  })._unsafeUnwrap()

  beforeAll(async () => {
    token = await sign({
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      iss: `https://${env.AUTH_DOMAIN}/`,
      sub: testUser.auth0UserId,
      aud: [env.AUTH_AUDIENCE],
    }, env.TEST_PRIVATE_KEY, 'RS256')

    // テストユーザとテスト用月額表を登録
    await saveUser(env.D1)(testUser)
    await insertStandardIncomeTable(env.D1)(testTable)
  })

  afterEach(() => {
    fetchMock.assertNoPendingInterceptors()
  })

  test('単一の月額表を取得できること', async () => {
    const result = await client[':id'].$get({ param: { id: testTable.id } }, { headers: { Authorization: `Bearer ${token}` } })

    const stored = await result.json()
    expect(stored).toStrictEqual(testTable)
  })

  test('複数の月額表を取得できること', async () => {
    const anotherTable = createStandardIncomeTable({
      userId: testUser.id,
      name: '別の月額表',
      grades: [
        {
          threshold: 0,
          standardIncome: 50000,
        },
      ].map(grade => createStandardIncomeGrade(grade)._unsafeUnwrap()),
    })._unsafeUnwrap()
    await insertStandardIncomeTable(env.D1)(anotherTable)

    const result = await client['index'].$get({ query: { order: 'asc' } }, { headers: { Authorization: `Bearer ${token}` } })

    const stored = await result.json()
    expect(stored).toStrictEqual([
      {
        id: testTable.id,
        userId: testTable.userId,
        name: testTable.name,
      },
      {
        id: anotherTable.id,
        userId: anotherTable.userId,
        name: anotherTable.name,
      },
    ])
  })

  describe('新規に月額表を作成できること', () => {
    type ResponseType = InferResponseType<typeof client.index.$post, 201>

    let actual: Awaited<ReturnType<typeof client.index.$post>>

    const input = {
      name: '新規月額表',
      grades: [
        {
          threshold: 0,
          standardIncome: 88000,
        },
        {
          threshold: 93000,
          standardIncome: 98000,
        },
      ],
    }

    beforeAll(async () => {
      actual = await client.index.$post({ json: input }, { headers: { Authorization: `Bearer ${token}` } })
    })

    test('201が返ること', () => {
      expect(actual.status).toBe(201)
    })

    test('作成されたエンティティを取得できること', async () => {
      const created = await actual.json() as ResponseType

      const stored = await getStandardIncomeTable(env.D1)({
        userId: created.userId,
        id: created.id,
      })

      expect(stored).toStrictEqual(created)
    })
  })

  describe('月額表の名前を更新できること', () => {
    type ResponseType = InferResponseType<typeof client[':id']['$patch'], 200>

    let actual: Awaited<ReturnType<typeof client[':id']['$patch']>>

    const input = { name: '更新後の名前' }

    beforeAll(async () => {
      actual = await client[':id'].$patch({
        param: { id: testTable.id },
        json: input,
      }, { headers: { Authorization: `Bearer ${token}` } })
    })

    test('200が返ること', () => {
      expect(actual.status).toBe(200)
    })

    test('名前が更新されていること', async () => {
      const updated = await actual.json() as ResponseType

      const stored = await getStandardIncomeTable(env.D1)({
        userId: updated.userId,
        id: updated.id,
      })

      expect(updated).toStrictEqual({
        id: stored?.id,
        userId: stored?.userId,
        name: stored?.name,
      })
    })
  })

  describe('月額表の等級を更新できること', () => {
    type ResponseType = InferResponseType<typeof client[':id']['$patch'], 200>

    let actual: Awaited<ReturnType<typeof client[':id']['$patch']>>

    const input = {
      grades: [
        {
          threshold: 0,
          standardIncome: 93000,
        },
        {
          threshold: 98000,
          standardIncome: 101000,
        },
        {
          threshold: 104000,
          standardIncome: 110000,
        },
      ],
    }

    beforeAll(async () => {
      actual = await client[':id'].$patch({
        param: { id: testTable.id },
        json: input,
      }, { headers: { Authorization: `Bearer ${token}` } })
    })

    test('200が返ること', () => {
      expect(actual.status).toBe(200)
    })

    test('階級が更新されていること', async () => {
      const updated = await actual.json() as ResponseType

      const stored = await getStandardIncomeTable(env.D1)({
        userId: updated.userId,
        id: updated.id,
      })

      expect(updated).toStrictEqual({
        id: stored?.id,
        userId: stored?.userId,
        name: stored?.name,
      })
    })
  })
})
