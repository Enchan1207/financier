import { env } from 'cloudflare:test'

import { saveUser } from '@/dao/authorize'
import { insertStandardIncomeTable } from '@/dao/standard_income'
import type { WorkdayValue } from '@/domains/financial_month_context'
import { createFinancialMonthInfo } from '@/domains/financial_month_context/logic'
import { createFinancialYear } from '@/domains/financial_year/logic'
import { createStandardIncomeTable } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import dayjs from '@/logic/dayjs'

import { insertFinancialYear } from '../financial_year/dao'
import {
  findFinancialMonthCotextsByDate,
  getFinancialMonthContext,
  updateFinancialMonthContext,
} from './dao'

const dummyUser: User = createUser({
  name: 't_est_user',
  email: 'test@example.com',
  auth0UserId: 'auth0_test_user',
})

const dummyStandardIncomeTable = createStandardIncomeTable({
  userId: dummyUser.id,
  name: 'テスト',
  grades: [
    {
      threshold: 0,
      standardIncome: 10000,
    },
  ],
})._unsafeUnwrap()

describe('日付に基づく項目の選択', () => {
  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    financialYear: 2024,
    standardIncomeTableId: dummyStandardIncomeTable.id,
  })._unsafeUnwrap()

  const dummyEntityApril = dummyFinancialYear.months.find(
    ({ info }) => info.month === 4,
  )
  const dummyEntityMay = dummyFinancialYear.months.find(
    ({ info }) => info.month === 5,
  )

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertStandardIncomeTable(env.D1)(dummyStandardIncomeTable)
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
      const actual = await findFinancialMonthCotextsByDate(env.D1)({
        userId: dummyUser.id,
        date,
      })

      // dayjsオブジェクトについては内部のプロパティが細かく変わっているので、タイムスタンプで比較
      expect(actual).toStrictEqual(expected)
    },
  )
})

describe('月度情報からエンティティを得る', () => {
  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    financialYear: 2024,
    standardIncomeTableId: dummyStandardIncomeTable.id,
  })._unsafeUnwrap()

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertStandardIncomeTable(env.D1)(dummyStandardIncomeTable)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
  })

  test('範囲内なら取得できること', async () => {
    const targetMonth = createFinancialMonthInfo({
      financialYear: 2024,
      month: 4,
    })._unsafeUnwrap()

    const entity = await getFinancialMonthContext(env.D1)({
      userId: dummyUser.id,
      info: targetMonth,
    })

    expect(entity).toBeDefined()
  })

  test('範囲外なら取得できないこと', async () => {
    const targetMonth = createFinancialMonthInfo({
      financialYear: 2025,
      month: 4,
    })._unsafeUnwrap()

    const entity = await getFinancialMonthContext(env.D1)({
      userId: dummyUser.id,
      info: targetMonth,
    })

    expect(entity).toBeUndefined()
  })
})

describe('勤務日数の更新', () => {
  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    financialYear: 2024,
    standardIncomeTableId: dummyStandardIncomeTable.id,
  })._unsafeUnwrap()

  const dummyFinancialMonth = dummyFinancialYear.months[0]

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertStandardIncomeTable(env.D1)(dummyStandardIncomeTable)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
  })

  test('初期値として20が入っていること', () => {
    expect(dummyFinancialMonth.workday).toBe(20)
  })

  test('更新でき、反映されていること', async () => {
    const result = await updateFinancialMonthContext(env.D1)({
      id: dummyFinancialMonth.id,
      userId: dummyUser.id,
      workday: 10 as WorkdayValue,
    })

    expect(result?.workday).toBe(10)
  })
})
