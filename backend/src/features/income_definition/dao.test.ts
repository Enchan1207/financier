import { env } from 'cloudflare:test'

import type { Months } from '@/domains/financial_month'
import { getPeriodByFinancialMonth } from '@/domains/financial_month/logic'
import type { IncomeDefinition } from '@/domains/income_definition'
import { createIncomeDefinition } from '@/domains/income_definition/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'

import { saveUser } from '../authorize/dao'
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

  const dummyDefinition = createIncomeDefinition({
    userId: dummyUser.id,
    name: '基本給',
    kind: 'absolute',
    value: 230000,
    isTaxable: true,
    from: {
      financialYear: 2025,
      month: 4,
    },
    to: {
      financialYear: 2025,
      month: 3,
    },
  })._unsafeUnwrap()

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)

    await insertIncomeDefinition(env.D1)(dummyDefinition)
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
          from: {
            financialYear: 2025,
            month: 6,
          },
          to: {
            financialYear: 2025,
            month: 1,
          },
        },
      })
    })

    test('値が更新されていること', () => {
      const { start } = getPeriodByFinancialMonth({
        financialYear: 2025,
        month: 6,
      })

      const { end } = getPeriodByFinancialMonth({
        financialYear: 2025,
        month: 1,
      })

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
    from: {
      financialYear: 2025,
      month: 4,
    },
    to: {
      financialYear: 2025,
      month: 12,
    },
  })._unsafeUnwrap()

  const dummyDefinition2 = createIncomeDefinition({
    userId: dummyUser.id,
    name: '手当2',
    kind: 'related_by_workday',
    value: 380,
    isTaxable: true,
    from: {
      financialYear: 2025,
      month: 8,
    },
    to: {
      financialYear: 2025,
      month: 2,
    },
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
    const actual = await findIncomeDefinitions(env.D1)({
      userId: dummyUser.id,
      sortBy: 'enabledAt',
      order: 'asc',
      limit: 100,
      period: {
        at: {
          financialYear: 2025,
          month: month as Months,
        },
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
      period: { at: 2025 },
    })

    expect(actual.map(makeComparable))
      .toStrictEqual([dummyDefinition1, dummyDefinition2].map(makeComparable))
  })
})
