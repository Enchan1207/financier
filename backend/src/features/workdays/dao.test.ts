import { env } from 'cloudflare:test'

import type { User } from '@/domain/user'
import { createUser } from '@/domain/user/logic'
import type { Workday } from '@/domain/workday'
import { createWorkday } from '@/domain/workday/logic'
import type { FinancialMonth } from '@/features/financial_months/domain/entity'
import { createFinancialMonth } from '@/features/financial_months/domain/entity'
import { useFinancialMonthRepositoryD1 } from '@/features/financial_months/infrastructure/repositoryImpl'
import dayjs from '@/logic/dayjs'

import { saveUser } from '../authorize/dao'
import { findWorkdayByFinancialMonthId, saveWorkday } from './dao'

describe('勤務日数エントリの操作', () => {
  const dummyUser: User = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyFinancialMonth: FinancialMonth = createFinancialMonth({
    userId: dummyUser.id,
    financialYear: 2025,
    month: 4,
  })

  const dummyWorkday: Workday = createWorkday({
    userId: dummyUser.id,
    financialMonth: dummyFinancialMonth,
    count: 20,
  })

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)

    const financialMonthRepository = useFinancialMonthRepositoryD1(env.D1)
    await financialMonthRepository.insertFinancialMonth(dummyFinancialMonth)

    await saveWorkday(env.D1)(dummyWorkday)
  })

  test('会計月度IDからエンティティを取得できること', async () => {
    const actual
     = await findWorkdayByFinancialMonthId(env.D1)(dummyFinancialMonth.id)
    expect(actual).toStrictEqual(dummyWorkday)
  })

  test('項目を更新できること', async () => {
    const updated: Workday = {
      ...dummyWorkday,
      count: 17,
      updatedAt: dayjs.tz('2023-08-08T00:00:00', 'Asia/Tokyo'),
    }

    await saveWorkday(env.D1)(updated)

    const actual
    = await findWorkdayByFinancialMonthId(env.D1)(dummyFinancialMonth.id)
    expect({
      ...actual,
      updatedAt: actual?.updatedAt.valueOf(),
    }).toStrictEqual({
      ...updated,
      updatedAt: updated.updatedAt.valueOf(),
    })
  })
})
