import { env } from 'cloudflare:test'

import type { FinancialMonthData } from '@/domains/financial_month'
import { createFinancialMonthData } from '@/domains/financial_month/logic'
import { createIncomeDefinition } from '@/domains/income_definition/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import { saveUser } from '@/features/authorize/dao'
import { EntityNotFoundError } from '@/logic/errors'

import { getIncomeDefinitionById, insertIncomeDefinition } from '../dao'
import { createIncomeDefinitionGetWorkflow } from './get'

describe('報酬定義取得ワークフロー', () => {
  const dummyUser: User = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const anotherUser: User = createUser({
    name: 'another',
    email: 'another@example.com',
    auth0UserId: 'auth0_another_user',
  })

  const fromMonth: FinancialMonthData = createFinancialMonthData({
    financialYear: 2025,
    month: 4,
    workday: 20,
  })._unsafeUnwrap()

  const toMonth: FinancialMonthData = createFinancialMonthData({
    financialYear: 2025,
    month: 12,
    workday: 20,
  })._unsafeUnwrap()

  const dummyEntity = createIncomeDefinition({
    userId: dummyUser.id,
    name: '手当1',
    kind: 'related_by_workday',
    value: 350,
    isTaxable: true,
    from: fromMonth,
    to: toMonth,
  })._unsafeUnwrap()

  const workflow = createIncomeDefinitionGetWorkflow({
    getIncomeDefinitionById: getIncomeDefinitionById(env.D1),
  })

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await saveUser(env.D1)(anotherUser)
    await insertIncomeDefinition(env.D1)(dummyEntity)
  })

  test('存在しない項目は取得できないこと', async () => {
    const command = {
      input: { id: 'invalid_id' },
      state: { user: dummyUser },
    }

    const result = await workflow(command)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(EntityNotFoundError)
  })

  test('他人の項目は取得できないこと', async () => {
    const command = {
      input: { id: dummyEntity.id },
      state: { user: anotherUser },
    }

    const result = await workflow(command)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(EntityNotFoundError)
  })

  test('自分の項目を取得できること', async () => {
    const command = {
      input: { id: dummyEntity.id },
      state: { user: dummyUser },
    }

    const actual = (await workflow(command))._unsafeUnwrap()
    expect(actual.id).toStrictEqual(dummyEntity.id)
  })
})
