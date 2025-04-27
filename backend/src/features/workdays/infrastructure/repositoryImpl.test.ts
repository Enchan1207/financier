import { env } from 'cloudflare:test'

import type { FinancialMonth } from '@/features/financial_months/domain/entity'
import { createFinancialMonth } from '@/features/financial_months/domain/entity'
import { useFinancialMonthRepositoryD1 } from '@/features/financial_months/infrastructure/repositoryImpl'
import type { User } from '@/features/users/domain/entity'
import { createUserEntity } from '@/features/users/domain/entity'
import { useUserRepositoryD1 } from '@/features/users/infrastructure/repositoryImpl'
import dayjs from '@/logic/dayjs'

import type { Workday } from '../domain/entity'
import { createWorkday } from '../domain/entity'
import type { WorkdayRepository } from '../domain/repository'
import { useWorkdayRepositoryD1 } from './repositoryImpl'

describe('勤務日数エントリの操作', () => {
  let repo: WorkdayRepository

  const dummyUser: User = createUserEntity({
    name: 'testuser',
    email: 'test@example.com',
    auth0_user_id: 'auth0_test_user',
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
    const userRepository = useUserRepositoryD1(env.D1)
    await userRepository.saveUser(dummyUser)

    repo = useWorkdayRepositoryD1(env.D1)

    const financialMonthRepository = useFinancialMonthRepositoryD1(env.D1)
    await financialMonthRepository.insertFinancialMonth(dummyFinancialMonth)

    await repo.saveWorkday(dummyWorkday)
  })

  test('会計月度IDからエンティティを取得できること', async () => {
    const actual = await repo.findByFinancialMonthId(dummyFinancialMonth.id)
    expect(actual).toStrictEqual(dummyWorkday)
  })

  test('項目を更新できること', async () => {
    const updated: Workday = {
      ...dummyWorkday,
      count: 17,
      updatedAt: dayjs.tz('2023-08-08T00:00:00', 'Asia/Tokyo'),
    }

    await repo.saveWorkday(updated)

    const actual = await repo.findByFinancialMonthId(dummyFinancialMonth.id)
    expect({
      ...actual,
      updatedAt: actual?.updatedAt.valueOf(),
    }).toStrictEqual({
      ...updated,
      updatedAt: updated.updatedAt.valueOf(),
    })
  })
})
