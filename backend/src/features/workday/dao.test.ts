import { env } from 'cloudflare:test'

import { createFinancialYear } from '@/domains/financial_year/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'

import { saveUser } from '../authorize/dao'
import { insertFinancialYear } from '../financial_year/dao'
import { findWorkdayByFinancialMonthId, updateWorkday } from './dao'

describe('勤務日数エントリの操作', () => {
  const dummyUser: User = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    year: 2025,
  })._unsafeUnwrap()

  const dummyFinancialMonth = dummyFinancialYear.months[0]

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
  })

  test('会計月度IDからエンティティを取得できること', async () => {
    const actual
     = await findWorkdayByFinancialMonthId(env.D1)(dummyFinancialMonth.id)
    expect(actual).toBeDefined()
  })

  test('項目を更新できること', async () => {
    await updateWorkday(env.D1)({
      userId: dummyUser.id,
      financialMonthId: dummyFinancialMonth.id,
      count: 17,
    })

    const actual
    = await findWorkdayByFinancialMonthId(env.D1)(dummyFinancialMonth.id)
    expect({
      ...actual,
      updatedAt: actual?.updatedAt.valueOf(),
    }).toStrictEqual({
      ...actual,
      count: 17,
      updatedAt: actual?.updatedAt.valueOf(),
    })
  })
})
