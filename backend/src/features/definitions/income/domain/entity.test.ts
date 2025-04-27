import type { FinancialMonthData } from '@/features/financial_months/domain/valueObject'
import dayjs from '@/logic/dayjs'

import { createIncomeDefinition } from './entity'

describe('報酬定義エンティティの生成', () => {
  const from: FinancialMonthData = {
    financialYear: 2024,
    month: 12,
  }

  const to: FinancialMonthData = {
    financialYear: 2024,
    month: 1,
  }

  const entity = createIncomeDefinition({
    from,
    to,
    name: 'test',
    kind: 'absolute',
    value: 0,
    isTaxable: true,
    userId: 'test_user',
  })

  test('定義の開始は2024年12月はじめであること', () => {
    const expected = dayjs.tz('2024-12-01T00:00:00.000', 'Asia/Tokyo')
    expect(entity.enabledAt.valueOf()).toBe(expected.valueOf())
  })

  test('定義の終了は2025年1月おわりであること', () => {
    const expected = dayjs.tz('2025-01-31T23:59:59.999', 'Asia/Tokyo')
    expect(entity.disabledAt.valueOf()).toBe(expected.valueOf())
  })
})
