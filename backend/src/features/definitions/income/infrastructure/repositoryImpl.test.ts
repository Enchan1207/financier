import { env } from 'cloudflare:test'

import type { Months } from '@/features/financial_months/domain/valueObject'
import { getPeriodByFinancialMonth } from '@/features/financial_months/domain/valueObject'

import type { IncomeDefinition } from '../domain/entity'
import { createIncomeDefinition } from '../domain/entity'
import { useIncomeDefinitionRepositoryD1 } from './repositoryImpl'

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
  const repository = useIncomeDefinitionRepositoryD1(env.D1)

  const userId = 'test_user'

  const dummyDefinition = createIncomeDefinition({
    userId,
    name: '基本給',
    kind: 'absolute',
    value: 230000,
    from: {
      financialYear: 2025,
      month: 4,
    },
    to: {
      financialYear: 2025,
      month: 3,
    },
  })

  beforeAll(async () => {
    await repository.insertIncomeDefinition(dummyDefinition)
  })

  describe('id直打ちで取得', () => {
    let actual: IncomeDefinition | undefined

    beforeAll(async () => {
      actual = await repository.findById(dummyDefinition.id)
    })

    test('同じ項目を取得できること', () => {
      expect(makeComparable(actual))
        .toStrictEqual(makeComparable(dummyDefinition))
    })
  })

  describe('項目の更新', () => {
    let actual: IncomeDefinition | undefined

    beforeAll(async () => {
      actual = await repository.updateIncomeDefinition(dummyDefinition.id, {
        kind: 'related_by_workday',
        name: '通勤手当',
        value: 300,
        from: {
          financialYear: 2025,
          month: 6,
        },
        to: {
          financialYear: 2025,
          month: 1,
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
        enabledAt: start.valueOf(),
        disabledAt: end.valueOf(),
        updatedAt: actual?.updatedAt.valueOf(),
      })
    })
  })

  describe('項目の削除', () => {
    beforeAll(async () => {
      await repository.deleteIncomeDefinition(dummyDefinition.id)
    })

    test('削除済みの項目は取得できないこと', async () => {
      const actual = await repository.findById(dummyDefinition.id)
      expect(actual).toBeUndefined()
    })
  })
})

describe('詳細な検索', () => {
  const repository = useIncomeDefinitionRepositoryD1(env.D1)

  const userId = 'test_user'

  const dummyDefinition1 = createIncomeDefinition({
    userId,
    name: '手当1',
    kind: 'related_by_workday',
    value: 380,
    from: {
      financialYear: 2025,
      month: 4,
    },
    to: {
      financialYear: 2025,
      month: 12,
    },
  })

  const dummyDefinition2 = createIncomeDefinition({
    userId,
    name: '手当2',
    kind: 'related_by_workday',
    value: 380,
    from: {
      financialYear: 2025,
      month: 8,
    },
    to: {
      financialYear: 2025,
      month: 2,
    },
  })

  beforeAll(async () => {
    await repository.insertIncomeDefinition(dummyDefinition1)
    await repository.insertIncomeDefinition(dummyDefinition2)
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
    const actual = await repository.findByFinancialMonth({
      userId,
      financialMonth: {
        financialYear: 2025,
        month: month as Months,
      },
      sortBy: 'enabledAt',
      order: 'asc',
      limit: 100,
    })

    expect(actual.map(makeComparable))
      .toStrictEqual(expected.map(makeComparable))
  })

  test('年度全体での検索', async () => {
    const actual = await repository.findByFinancialYear({
      userId,
      financialYear: 2025,
      sortBy: 'enabledAt',
      order: 'asc',
      limit: 100,
    })

    expect(actual.map(makeComparable))
      .toStrictEqual([dummyDefinition1, dummyDefinition2].map(makeComparable))
  })
})
