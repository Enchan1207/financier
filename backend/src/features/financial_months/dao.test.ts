import { env } from 'cloudflare:test'

import type { FinancialMonth } from '@/domain/financial_month'
import { createFinancialMonth } from '@/domain/financial_month/logic'
import type { User } from '@/domain/user'
import { createUser } from '@/domain/user/logic'
import dayjs from '@/logic/dayjs'

import { saveUser } from '../authorize/dao'
import {
  findFinancialMonthsByDate,
  findFinancialMonthsByMonth, findFinancialMonthsByYear, insertFinancialMonth,
} from './dao'

describe('会計年度と月に基づく項目の選択', () => {
  const dummyUser: User = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyEntities: FinancialMonth[] = [
    createFinancialMonth({
      userId: dummyUser.id,
      financialYear: 2024,
      month: 1,
    }),
    createFinancialMonth({
      userId: dummyUser.id,
      financialYear: 2024,
      month: 2,
    }),
    createFinancialMonth({
      userId: dummyUser.id,
      financialYear: 2025,
      month: 1,
    }),
    createFinancialMonth({
      userId: dummyUser.id,
      financialYear: 2025,
      month: 2,
    }),
    createFinancialMonth({
      userId: dummyUser.id,
      financialYear: 2025,
      month: 3,
    }),
  ]

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)

    await Promise.all(dummyEntities.map(entity => insertFinancialMonth(env.D1)(entity)))
  })

  test('FY2024の項目数は2であること', async () => {
    const actual = await findFinancialMonthsByYear(env.D1)(dummyUser.id, 2024)
    expect(actual).toHaveLength(2)
  })

  test('FY2024の項目数は3であること', async () => {
    const actual = await findFinancialMonthsByYear(env.D1)(dummyUser.id, 2025)
    expect(actual).toHaveLength(3)
  })

  test('FY2024 1月の項目を取得できること', async () => {
    const actual = await findFinancialMonthsByMonth(env.D1)(dummyUser.id, {
      financialYear: 2024,
      month: 1,
    })
    expect(actual).toBeDefined()
  })

  test('FY2024 3月の項目は取得できないこと', async () => {
    const actual = await findFinancialMonthsByMonth(env.D1)(dummyUser.id, {
      financialYear: 2024,
      month: 3,
    })
    expect(actual).toBeUndefined()
  })
})

describe('日付に基づく項目の選択', () => {
  const dummyUser: User = createUser({
    name: 't_est_user',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyEntityApril = createFinancialMonth({
    userId: dummyUser.id,
    financialYear: 2024,
    month: 4,
  })

  const dummyEntityMay = createFinancialMonth({
    userId: dummyUser.id,
    financialYear: 2024,
    month: 5,
  })

  const dummyEntities = [dummyEntityApril, dummyEntityMay]

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await Promise.all(dummyEntities.map(entity => insertFinancialMonth(env.D1)(entity)))
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
    const actual = await findFinancialMonthsByDate(env.D1)(dummyUser.id, date)

    // dayjsオブジェクトについては内部のプロパティが細かく変わっているので、タイムスタンプで比較
    expect(actual).toStrictEqual(expected)
  })
})
