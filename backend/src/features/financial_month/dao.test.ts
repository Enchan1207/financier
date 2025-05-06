import { env } from 'cloudflare:test'

import { createFinancialYear } from '@/domains/financial_year/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import dayjs from '@/logic/dayjs'

import { saveUser } from '../authorize/dao'
import { insertFinancialYear } from '../financial_year/dao'
import { findFinancialMonthsByDate } from './dao'

describe('日付に基づく項目の選択', () => {
  const dummyUser: User = createUser({
    name: 't_est_user',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    year: 2024,
  })

  const dummyEntityApril = dummyFinancialYear.months.find(month => month.month === 4)
  const dummyEntityMay = dummyFinancialYear.months.find(month => month.month === 5)

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
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
