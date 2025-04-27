import { env } from 'cloudflare:test'

import { getPeriodByFinancialMonth } from '@/features/financial_months/domain/valueObject'

import type { IncomeDefinition } from '../domain/entity'
import { createIncomeDefinition } from '../domain/entity'
import { useIncomeDefinitionRepositoryD1 } from './repositoryImpl'

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
      expect({
        ...actual,
        enabledAt: actual?.enabledAt.valueOf(),
        disabledAt: actual?.disabledAt.valueOf(),
        updatedAt: actual?.updatedAt.valueOf(),
      }).toStrictEqual({
        ...dummyDefinition,
        enabledAt: dummyDefinition.enabledAt.valueOf(),
        disabledAt: dummyDefinition.disabledAt.valueOf(),
        updatedAt: dummyDefinition.updatedAt.valueOf(),
      })
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

      expect({
        ...actual,
        enabledAt: actual?.enabledAt.valueOf(),
        disabledAt: actual?.disabledAt.valueOf(),
        updatedAt: actual?.updatedAt.valueOf(),
      }).toStrictEqual({
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
