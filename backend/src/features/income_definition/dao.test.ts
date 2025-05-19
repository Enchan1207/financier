import { env } from 'cloudflare:test'

import { createFinancialMonthData, getPeriodByFinancialMonth } from '@/domains/financial_month/logic'
import { createFinancialYear } from '@/domains/financial_year/logic'
import type { IncomeDefinition } from '@/domains/income_definition'
import { createIncomeDefinition } from '@/domains/income_definition/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import dayjs from '@/logic/dayjs'

import { saveUser } from '../authorize/dao'
import { insertFinancialYear } from '../financial_year/dao'
import {
  findIncomeDefinitions,
  getIncomeDefinitionById, insertIncomeDefinition, updateIncomeDefinition,
} from './dao'

/** エンティティを相互変換可能な型に変換する */
const makeComparable = (entity?: IncomeDefinition) => {
  return {
    ...entity,
    enabledAt: entity?.enabledAt.valueOf(),
    disabledAt: entity?.disabledAt.valueOf(),
    updatedAt: entity?.updatedAt.valueOf(),
  }
}

describe('基本的なCRUD', () => {
  const dummyUser: User = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    year: 2025,
  })._unsafeUnwrap()

  const dummyDefinition = createIncomeDefinition({
    userId: dummyUser.id,
    name: '基本給',
    kind: 'absolute',
    value: 230000,
    isTaxable: true,
    from: createFinancialMonthData({
      financialYear: 2025,
      month: 4,
      workday: 20,
    })._unsafeUnwrap(),
    to: createFinancialMonthData({
      financialYear: 2025,
      month: 3,
      workday: 20,
    })._unsafeUnwrap(),
  })._unsafeUnwrap()

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)

    await insertFinancialYear(env.D1)(dummyFinancialYear)

    await insertIncomeDefinition(env.D1)(dummyDefinition)
  })

  test('報酬実績が登録されていないこと', async () => {
    const stmt = 'SELECT COUNT(*) count FROM income_records'
    const result = await env.D1.prepare(stmt).first<{ count: number }>()
    expect(result?.count).toBe(0)
  })

  describe('id直打ちで取得', () => {
    let actual: IncomeDefinition | undefined

    beforeAll(async () => {
      actual = await getIncomeDefinitionById(env.D1)(dummyDefinition.id)
    })

    test('同じ項目を取得できること', () => {
      expect(makeComparable(actual))
        .toStrictEqual(makeComparable(dummyDefinition))
    })
  })

  describe('項目の更新', () => {
    let actual: IncomeDefinition | undefined

    beforeAll(async () => {
      actual = await updateIncomeDefinition(env.D1)(dummyDefinition.id, {
        current: dummyDefinition,
        update: {
          kind: 'related_by_workday',
          name: '通勤手当',
          isTaxable: undefined,
          value: 300,
          from: createFinancialMonthData({
            financialYear: 2025,
            month: 6,
            workday: 20,
          })._unsafeUnwrap(),
          to: createFinancialMonthData({
            financialYear: 2025,
            month: 1,
            workday: 20,
          })._unsafeUnwrap(),
        },
      })
    })

    test('値が更新されていること', () => {
      const { start } = getPeriodByFinancialMonth(createFinancialMonthData({
        financialYear: 2025,
        month: 6,
        workday: 20,
      })._unsafeUnwrap())

      const { end } = getPeriodByFinancialMonth(createFinancialMonthData({
        financialYear: 2025,
        month: 1,
        workday: 20,
      })._unsafeUnwrap())

      expect(makeComparable(actual)).toStrictEqual({
        id: dummyDefinition.id,
        userId: dummyDefinition.userId,
        kind: 'related_by_workday',
        name: '通勤手当',
        value: 300,
        isTaxable: true,
        enabledAt: start.valueOf(),
        disabledAt: end.valueOf(),
        updatedAt: actual?.updatedAt.valueOf(),
      })
    })
  })
})

describe('詳細な検索', () => {
  const dummyUser: User = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyDefinition1 = createIncomeDefinition({
    userId: dummyUser.id,
    name: '手当1',
    kind: 'related_by_workday',
    value: 380,
    isTaxable: false,
    from: createFinancialMonthData({
      financialYear: 2025,
      month: 4,
      workday: 20,
    })._unsafeUnwrap(),
    to: createFinancialMonthData({
      financialYear: 2025,
      month: 12,
      workday: 20,
    })._unsafeUnwrap(),
  })._unsafeUnwrap()

  const dummyDefinition2 = createIncomeDefinition({
    userId: dummyUser.id,
    name: '手当2',
    kind: 'related_by_workday',
    value: 380,
    isTaxable: true,
    from: createFinancialMonthData({
      financialYear: 2025,
      month: 8,
      workday: 20,
    })._unsafeUnwrap(),
    to: createFinancialMonthData({
      financialYear: 2025,
      month: 2,
      workday: 20,
    })._unsafeUnwrap(),
  })._unsafeUnwrap()

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)

    await insertIncomeDefinition(env.D1)(dummyDefinition1)
    await insertIncomeDefinition(env.D1)(dummyDefinition2)
  })

  test.each([
    {
      month: 4,
      expected: [dummyDefinition1],
    },
    {
      month: 8,
      expected: [dummyDefinition1, dummyDefinition2],
    },
    {
      month: 1,
      expected: [dummyDefinition2],
    },
  ])('単月検索 $month月度', async ({ month, expected }) => {
    const financialMonth = createFinancialMonthData({
      financialYear: 2025,
      month,
      workday: 20,
    })._unsafeUnwrap()
    const { start, end } = getPeriodByFinancialMonth(financialMonth)

    const actual = await findIncomeDefinitions(env.D1)({
      userId: dummyUser.id,
      sortBy: 'enabledAt',
      order: 'asc',
      limit: 100,
      period: {
        start,
        end,
      },
    })

    expect(actual.map(makeComparable))
      .toStrictEqual(expected.map(makeComparable))
  })

  test('年度全体での検索', async () => {
    const actual = await findIncomeDefinitions(env.D1)({
      userId: dummyUser.id,
      sortBy: 'enabledAt',
      order: 'asc',
      limit: 100,
      period: {
        start: dayjs.tz('2025-04-01T00:00:00.000', 'Asia/Tokyo'),
        end: dayjs.tz('2026-03-31T23:59:59.999', 'Asia/Tokyo'),
      },
    })

    expect(actual.map(makeComparable))
      .toStrictEqual([dummyDefinition1, dummyDefinition2].map(makeComparable))
  })
})

// TODO: 報酬定義の更新テストケース
