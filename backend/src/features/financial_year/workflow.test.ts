import { env } from 'cloudflare:test'

import { getFinancialMonthFromDate } from '@/domains/financial_month/logic'
import type { FinancialYearValue } from '@/domains/financial_year'
import { createFinancialYear } from '@/domains/financial_year/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import dayjs from '@/logic/dayjs'

import { saveUser } from '../authorize/dao'
import { insertFinancialYear, listFinancialYears } from './dao'
import { createFinancialYearPostWorkflow } from './workflow'

describe('会計年度生成ワークフロー', () => {
  const dummyUser: User = createUser({
    name: 't_est_user',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const workflow = createFinancialYearPostWorkflow({
    listFinancialYears: listFinancialYears(env.D1),
  })

  const currentFinancialYear =
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    getFinancialMonthFromDate(dayjs())!.financialYear

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
  })

  describe('会計年度が一件も存在しない場合', () => {
    test('現在の会計年度に等しければ作成できること', async () => {
      const result = await workflow({
        input: { year: currentFinancialYear },
        state: { user: dummyUser },
      })

      expect(result.isOk()).toBeTruthy()
    })

    test('現在の会計年度に等しくなければ作成できないこと', async () => {
      const result = await workflow({
        input: { year: (currentFinancialYear + 1) as FinancialYearValue },
        state: { user: dummyUser },
      })

      expect(result.isOk()).toBeFalsy()
    })
  })

  describe('既存の会計年度が存在する場合', () => {
    beforeAll(async () => {
      const financialYear = createFinancialYear({
        userId: dummyUser.id,
        financialYear: currentFinancialYear,
      })._unsafeUnwrap()

      await insertFinancialYear(env.D1)(financialYear)
    })

    test('同じ年度のものは作成できないこと', async () => {
      const result = await workflow({
        input: { year: currentFinancialYear },
        state: { user: dummyUser },
      })

      expect(result.isOk()).toBeFalsy()
    })

    test('連続していれば作成できること', async () => {
      const result = await workflow({
        input: { year: (currentFinancialYear + 1) as FinancialYearValue },
        state: { user: dummyUser },
      })

      expect(result.isOk()).toBeTruthy()
    })

    test('連続していなければ作成できないこと', async () => {
      const result = await workflow({
        input: { year: (currentFinancialYear + 2) as FinancialYearValue },
        state: { user: dummyUser },
      })

      expect(result.isOk()).toBeFalsy()
    })
  })
})
