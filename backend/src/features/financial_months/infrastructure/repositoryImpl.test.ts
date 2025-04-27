import { env } from 'cloudflare:test'

import dayjs from '@/logic/dayjs'

import type { FinancialMonth } from '../domain/entity'
import { createFinancialMonth } from '../domain/entity'
import type { FinancialMonthRepository } from '../domain/repository'
import { useFinancialMonthRepositoryD1 } from './repositoryImpl'

describe('会計年度と月に基づく項目の選択', () => {
  let repo: FinancialMonthRepository

  const dummyEntities: FinancialMonth[] = [
    createFinancialMonth({
      userId: 'test_user',
      financialYear: 2024,
      month: 1,
    }),
    createFinancialMonth({
      userId: 'test_user',
      financialYear: 2024,
      month: 2,
    }),
    createFinancialMonth({
      userId: 'test_user',
      financialYear: 2025,
      month: 1,
    }),
    createFinancialMonth({
      userId: 'test_user',
      financialYear: 2025,
      month: 2,
    }),
    createFinancialMonth({
      userId: 'test_user',
      financialYear: 2025,
      month: 3,
    }),
  ]

  beforeAll(async () => {
    repo = useFinancialMonthRepositoryD1(env.D1)

    await Promise.all(dummyEntities.map(entity => repo.insertFinancialMonth(entity)))
  })

  test('FY2024の項目数は2であること', async () => {
    const actual = await repo.findByFinancialYear('test_user', 2024)
    expect(actual).toHaveLength(2)
  })

  test('FY2024の項目数は3であること', async () => {
    const actual = await repo.findByFinancialYear('test_user', 2025)
    expect(actual).toHaveLength(3)
  })

  test('FY2024 1月の項目を取得できること', async () => {
    const actual = await repo.findByFinancialMonth('test_user', {
      financialYear: 2024,
      month: 1,
    })
    expect(actual).toBeDefined()
  })

  test('FY2024 3月の項目は取得できないこと', async () => {
    const actual = await repo.findByFinancialMonth('test_user', {
      financialYear: 2024,
      month: 3,
    })
    expect(actual).toBeUndefined()
  })
})

describe('日付に基づく項目の選択', () => {
  let repo: FinancialMonthRepository

  const dummyEntityApril = createFinancialMonth({
    userId: 'test_user',
    financialYear: 2024,
    month: 4,
  })

  const dummyEntityMay = createFinancialMonth({
    userId: 'test_user',
    financialYear: 2024,
    month: 5,
  })

  const dummyEntities = [dummyEntityApril, dummyEntityMay]

  beforeAll(async () => {
    repo = useFinancialMonthRepositoryD1(env.D1)

    await Promise.all(dummyEntities.map(entity => repo.insertFinancialMonth(entity)))
  })

  test.each([
    {
      date: dayjs.tz('2024-04-10T00:00:00.000', 'Asia/Tokyo'),
      expected: dummyEntityApril,
    },
    {
      date: dayjs.tz('2024-04-10T00:00:00.000', 'Asia/Tokyo').endOf('month'),
      expected: dummyEntityApril,
    },
    {
      date: dayjs.tz('2024-05-10T00:00:00.000', 'Asia/Tokyo').startOf('month'),
      expected: dummyEntityMay,
    },
    {
      date: dayjs.tz('2024-05-10T00:00:00.000', 'Asia/Tokyo').endOf('month'),
      expected: dummyEntityMay,
    },
  ])('$date の場合、 $expected が取得されること', async ({ date, expected }) => {
    const actual = await repo.findByDate('test_user', date)

    // dayjsオブジェクトについては内部のプロパティが細かく変わっているので、タイムスタンプで比較
    expect(actual).toStrictEqual(expected)
  })
})
