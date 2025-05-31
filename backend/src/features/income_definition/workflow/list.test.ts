import { env } from 'cloudflare:test'

import type { FinancialMonthData } from '@/domains/financial_month'
import { createFinancialMonthData } from '@/domains/financial_month/logic'
import { createIncomeDefinition } from '@/domains/income_definition/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import { saveUser } from '@/features/authorize/dao'

import { findIncomeDefinitions, insertIncomeDefinition } from '../dao'
import type { UnvalidatedListIncomeDefinitionCommand } from './list'
import { createIncomeDefinitionListWorkflow } from './list'

describe('報酬定義一覧取得ワークフロー', () => {
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

  const fromMonth1: FinancialMonthData = createFinancialMonthData({
    financialYear: 2025,
    month: 4,
    workday: 20,
  })._unsafeUnwrap()

  const toMonth1: FinancialMonthData = createFinancialMonthData({
    financialYear: 2025,
    month: 12,
    workday: 20,
  })._unsafeUnwrap()

  const dummyDefinition1 = createIncomeDefinition({
    userId: dummyUser.id,
    name: '手当1',
    kind: 'related_by_workday',
    value: 350,
    isTaxable: true,
    from: fromMonth1,
    to: toMonth1,
  })._unsafeUnwrap()

  const fromMonth2: FinancialMonthData = createFinancialMonthData({
    financialYear: 2025,
    month: 8,
    workday: 20,
  })._unsafeUnwrap()

  const toMonth2: FinancialMonthData = createFinancialMonthData({
    financialYear: 2026,
    month: 2,
    workday: 20,
  })._unsafeUnwrap()

  const dummyDefinition2 = createIncomeDefinition({
    userId: dummyUser.id,
    name: '手当2',
    kind: 'absolute',
    value: 15000,
    isTaxable: false,
    from: fromMonth2,
    to: toMonth2,
  })._unsafeUnwrap()

  const workflow = createIncomeDefinitionListWorkflow({
    //
    findIncomeDefinitions: findIncomeDefinitions(env.D1),
  })

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await saveUser(env.D1)(anotherUser)
    await insertIncomeDefinition(env.D1)(dummyDefinition1)
    await insertIncomeDefinition(env.D1)(dummyDefinition2)
  })

  describe('基本的な一覧取得', () => {
    test('自分の項目の件数が正しいこと', async () => {
      const command: UnvalidatedListIncomeDefinitionCommand = {
        input: {
          sortBy: 'enabledAt',
          from: '2025_04',
          order: 'asc',
          limit: 100,
        },
        state: { user: dummyUser },
      }

      const actual = (await workflow(command))._unsafeUnwrap()
      expect(actual).toHaveLength(2)
    })

    test('他人の項目が取得されないこと', async () => {
      const command: UnvalidatedListIncomeDefinitionCommand = {
        input: {
          sortBy: 'enabledAt',
          order: 'asc',
          limit: 100,
        },
        state: { user: anotherUser },
      }

      const actual = (await workflow(command))._unsafeUnwrap()
      expect(actual).toHaveLength(0)
    })
  })

  test('種別でフィルタリングできること', async () => {
    const command: UnvalidatedListIncomeDefinitionCommand = {
      input: {
        sortBy: 'enabledAt',
        order: 'asc',
        limit: 100,
        kind: 'absolute',
      },
      state: { user: dummyUser },
    }

    const actual = (await workflow(command))._unsafeUnwrap()
    expect(actual).toHaveLength(1)
    expect(actual[0].id).toBe(dummyDefinition2.id)
  })

  test('開始期間と終了期間を指定してフィルタリングできること', async () => {
    const command: UnvalidatedListIncomeDefinitionCommand = {
      input: {
        sortBy: 'enabledAt',
        order: 'asc',
        limit: 100,
        from: '2025_04',
        to: '2025_07',
      },
      state: { user: dummyUser },
    }

    const actual = (await workflow(command))._unsafeUnwrap()

    expect(actual).toHaveLength(1)
    expect(actual[0].id).toBe(dummyDefinition1.id)
  })

  test('特定時点で有効な定義をフィルタリングできること', async () => {
    const command: UnvalidatedListIncomeDefinitionCommand = {
      input: {
        sortBy: 'enabledAt',
        order: 'asc',
        limit: 100,
        at: '2025_10',
      },
      state: { user: dummyUser },
    }

    const actual = (await workflow(command))._unsafeUnwrap()
    expect(actual).toHaveLength(2)
  })
  test('更新日時の降順で取得できること', async () => {
    const command: UnvalidatedListIncomeDefinitionCommand = {
      input: {
        sortBy: 'updatedAt',
        order: 'desc',
        limit: 100,
      },
      state: { user: dummyUser },
    }

    const actual = (await workflow(command))._unsafeUnwrap()
    expect(actual[0].updatedAt.isAfter(actual[1].updatedAt)).toBeTruthy()
  })
})
