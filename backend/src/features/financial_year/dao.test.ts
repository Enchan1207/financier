import { env } from 'cloudflare:test'

import { createFinancialYear } from '@/domains/financial_year/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'

import { saveUser } from '../authorize/dao'
import { insertFinancialYear } from './dao'

describe('会計年度の生成', () => {
  const dummyUser: User = createUser({
    name: 't_est_user',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    year: 2024,
  })

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
  })

  test('12個の会計月度エンティティが登録されていること', async () => {
    const stmt = 'SELECT COUNT(*) count FROM financial_months'
    const result = await env.D1.prepare(stmt).first<{ count: number }>()
    expect(result?.count).toBe(12)
  })
})
