import { env } from 'cloudflare:test'

import type { WorkdayValue } from '@/domains/financial_month'
import { createFinancialMonthData } from '@/domains/financial_month/logic'
import { createFinancialYear } from '@/domains/financial_year/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import dayjs from '@/logic/dayjs'

import { saveUser } from '../authorize/dao'
import { insertFinancialYear } from '../financial_year/dao'
import {
  findFinancialMonthsByDate,
  getFinancialMonthByFinancialMonth,
  updateFinancialMonth,
} from './dao'

describe('日付に基づく項目の選択', () => {
  const dummyUser: User = createUser({
    name: 't_est_user',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    year: 2024,
  })._unsafeUnwrap()

  const dummyEntityApril = dummyFinancialYear.months.find(
    (month) => month.month === 4,
  )
  const dummyEntityMay = dummyFinancialYear.months.find(
    (month) => month.month === 5,
  )

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
  ])(
    '$date の場合、 $expected が取得されること',
    async ({ date, expected }) => {
      const actual = await findFinancialMonthsByDate(env.D1)(dummyUser.id, date)

      // dayjsオブジェクトについては内部のプロパティが細かく変わっているので、タイムスタンプで比較
      expect(actual).toStrictEqual(expected)
    },
  )
})

describe('月度情報からエンティティを得る', () => {
  const dummyUser: User = createUser({
    name: 't_est_user',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    year: 2024,
  })._unsafeUnwrap()

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
  })

  test('範囲内なら取得できること', async () => {
    const targetMonth = createFinancialMonthData({
      financialYear: 2024,
      month: 4,
      workday: 20,
    })._unsafeUnwrap()

    const entity = await getFinancialMonthByFinancialMonth(env.D1)(
      dummyUser.id,
      targetMonth,
    )

    expect(entity).toBeDefined()
  })

  test('範囲外なら取得できないこと', async () => {
    const targetMonth = createFinancialMonthData({
      financialYear: 2025,
      month: 4,
      workday: 20,
    })._unsafeUnwrap()

    const entity = await getFinancialMonthByFinancialMonth(env.D1)(
      dummyUser.id,
      targetMonth,
    )

    expect(entity).toBeUndefined()
  })
})

describe('勤務日数の更新', () => {
  const dummyUser: User = createUser({
    name: 't_est_user',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    year: 2024,
  })._unsafeUnwrap()

  const dummyFinancialMonth = dummyFinancialYear.months[0]

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
  })

  test('初期値として20が入っていること', () => {
    expect(dummyFinancialMonth.workday).toBe(20)
  })

  test('更新でき、反映されていること', async () => {
    const result = await updateFinancialMonth(env.D1)(
      dummyUser.id,
      dummyFinancialMonth.id,
      { workday: 10 as WorkdayValue },
    )

    expect(result?.workday).toBe(10)
  })
})
