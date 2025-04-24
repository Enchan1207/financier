import { env } from 'cloudflare:test'

import type { User } from '@/features/users/domain/entity'
import { useUserRepositoryD1 } from '@/features/users/infrastructure/repositoryImpl'
import dayjs from '@/logic/dayjs'

import { useFinancialMonthRepositoryD1 } from '../infrastructure/repositoryImpl'
import { useFinancialMonthUsecase } from './usecase'

describe('会計年度の初期化', () => {
  const repo = useFinancialMonthRepositoryD1(env.D1)

  const usecase = useFinancialMonthUsecase(repo)

  const testUser: User = {
    id: 'test_user_id',
    name: 'test user',
    auth0_user_id: 'auth0_test_user',
    email: 'test@example.com',
  }

  beforeAll(async () => {
    const userRepository = useUserRepositoryD1(env.D1)
    await userRepository.saveUser(testUser)

    await usecase.initializeFinancialYear(testUser, 2025)
  })

  test('12個のエンティティが生成されていること', async () => {
    const actual = await repo
      .findByFinancialYear(testUser.id, 2025)
    expect(actual).toHaveLength(12)
  })

  test('FY2025の1月は2026年1月であること', async () => {
    const actual = await repo.findByFinancialYearAndMonth(testUser.id, 2025, 1)
    const actualStartedAt = actual?.startedAt.valueOf()

    expect(actualStartedAt).toStrictEqual(dayjs.tz('2026-01-01T00:00:00.000', 'Asia/Tokyo').valueOf())
  })
})

describe('現在時刻に基づくエンティティの取得', () => {
  const repo = useFinancialMonthRepositoryD1(env.D1)

  const usecase = useFinancialMonthUsecase(repo)

  const testUser1: User = {
    id: 'test_user_id_1',
    name: 'test user 1',
    auth0_user_id: 'auth0_test_user_1',
    email: 'test1@example.com',
  }

  const testUser2: User = {
    id: 'test_user_id_2',
    name: 'test user 2',
    auth0_user_id: 'auth0_test_user_2',
    email: 'test2@example.com',
  }

  beforeAll(async () => {
    const userRepository = useUserRepositoryD1(env.D1)
    await userRepository.saveUser(testUser1)
    await userRepository.saveUser(testUser2)

    await usecase.initializeFinancialYear(testUser1, 2025)
  })

  test('月度エンティティを取得できること', async () => {
    const now = dayjs.tz('2025-05-01T00:00:00.000', 'Asia/Tokyo')
    const result = await usecase.getCurrentFinancialMonth(testUser1, now)
    const actual = result._unsafeUnwrap()

    expect({
      userId: actual.userId,
      financialYear: actual.financialYear,
      month: actual.month,
    }).toStrictEqual({
      userId: testUser1.id,
      financialYear: 2025,
      month: 5,
    })
  })

  test('同じ時期であっても他人のエンティティは取得できないこと', async () => {
    const now = dayjs.tz('2025-05-01T00:00:00.000', 'Asia/Tokyo')
    const actual = await usecase.getCurrentFinancialMonth(testUser2, now)
    expect(actual.isOk()).toBeFalsy()
  })
})
