import { env } from 'cloudflare:test'

import { createFinancialYear } from '@/domains/financial_year/logic'
import { createIncomeDefinition } from '@/domains/income_definition/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import { saveUser } from '@/features/authorize/dao'
import { insertFinancialYear } from '@/features/financial_year/dao'

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

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    year: 2025,
  })._unsafeUnwrap()

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyApril = dummyFinancialYear.months.find(({ month }) => month === 4)!

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyAugust = dummyFinancialYear.months.find(
    ({ month }) => month === 8,
  )!

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummySeptember = dummyFinancialYear.months.find(
    ({ month }) => month === 9,
  )!

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyFebruary = dummyFinancialYear.months.find(
    ({ month }) => month === 2,
  )!

  const dummyDefinition1 = createIncomeDefinition({
    userId: dummyUser.id,
    name: '手当1',
    kind: 'related_by_workday',
    value: 350,
    isTaxable: true,
    from: dummyApril,
    to: dummySeptember,
  })._unsafeUnwrap()

  const dummyDefinition2 = createIncomeDefinition({
    userId: dummyUser.id,
    name: '手当2',
    kind: 'absolute',
    value: 15000,
    isTaxable: false,
    from: dummyAugust,
    to: dummyFebruary,
  })._unsafeUnwrap()

  const workflow = createIncomeDefinitionListWorkflow({
    findIncomeDefinitions: findIncomeDefinitions(env.D1),
  })

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await saveUser(env.D1)(anotherUser)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
    await insertIncomeDefinition(env.D1)(dummyDefinition1)
    await insertIncomeDefinition(env.D1)(dummyDefinition2)
  })

  describe('基本的な一覧取得', () => {
    test('自分の項目の件数が正しいこと', async () => {
      const command: UnvalidatedListIncomeDefinitionCommand = {
        input: {
          sortBy: 'enabledAt',
          from: '2025_04',
          to: '2025_03',
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
          from: '2025_04',
          to: '2025_03',
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
        from: '2025_04',
        to: '2025_03',
      },
      state: { user: dummyUser },
    }

    const actual = (await workflow(command))._unsafeUnwrap()
    expect(actual).toHaveLength(1)
    expect(actual[0].id).toBe(dummyDefinition2.id)
  })

  test.each([
    {
      from: '2025_04',
      to: '2025_07',
      at: undefined,
      expected: [dummyDefinition1.id],
    },
    {
      from: '2025_04',
      to: '2025_08',
      at: undefined,
      expected: [dummyDefinition1.id, dummyDefinition2.id],
    },
    {
      from: '2025_08',
      to: '2025_09',
      at: undefined,
      expected: [dummyDefinition1.id, dummyDefinition2.id],
    },
    {
      from: '2025_09',
      to: '2025_10',
      at: undefined,
      expected: [dummyDefinition1.id, dummyDefinition2.id],
    },
    {
      from: '2025_10',
      to: '2025_02',
      at: undefined,
      expected: [dummyDefinition2.id],
    },
    {
      at: '2025_08',
      expected: [dummyDefinition1.id, dummyDefinition2.id],
    },
    {
      at: '2025_09',
      expected: [dummyDefinition1.id, dummyDefinition2.id],
    },
  ])(
    'from: $from, to: $to, at: $at でフィルタした際 $expected.length件の定義が得られること',
    async ({ from, to, at, expected }) => {
      const command: UnvalidatedListIncomeDefinitionCommand = {
        input: {
          sortBy: 'enabledAt',
          order: 'asc',
          limit: 100,
          from,
          to,
          at,
        },
        state: { user: dummyUser },
      }

      const actual = (await workflow(command))._unsafeUnwrap()

      const ids = actual.map((def) => def.id)
      expect(ids).toStrictEqual(expected)
    },
  )
})
