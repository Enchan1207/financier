import { env } from 'cloudflare:test'

import {
  createStandardIncomeGrade,
  createStandardIncomeTable,
} from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import { saveUser } from '@/features/authorize/dao'

import { insertStandardIncomeTable, listStandardIncomeTables } from '../dao'
import { createStandardIncomeTablesListWorkflow } from './list'

describe('標準報酬月額表一覧取得ワークフロー', () => {
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

  // 2つのダミーエンティティを用意
  const dummyTable1 = createStandardIncomeTable({
    userId: dummyUser.id,
    name: 'test table 1',
    grades: [
      {
        threshold: 0,
        standardIncome: 50000,
      },
      {
        threshold: 100000,
        standardIncome: 100000,
      },
    ].map((grade) => createStandardIncomeGrade(grade)._unsafeUnwrap()),
  })._unsafeUnwrap()

  const dummyTable2 = createStandardIncomeTable({
    userId: dummyUser.id,
    name: 'test table 2',
    grades: [
      {
        threshold: 0,
        standardIncome: 50000,
      },
      {
        threshold: 200000,
        standardIncome: 200000,
      },
    ].map((grade) => createStandardIncomeGrade(grade)._unsafeUnwrap()),
  })._unsafeUnwrap()

  const workflow = createStandardIncomeTablesListWorkflow({
    //
    listStandardIncomeTables: listStandardIncomeTables(env.D1),
  })

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertStandardIncomeTable(env.D1)(dummyTable1)
    await insertStandardIncomeTable(env.D1)(dummyTable2)
  })

  describe('自分の項目の取得', () => {
    test('自分の項目の件数が正しいこと', async () => {
      const command = {
        input: { order: 'asc' as const },
        state: { user: dummyUser },
      }

      const actual = await workflow(command)
      expect(actual).toHaveLength(2)
    })

    test('昇順で取得した場合、正しい順序で項目が取得できること', async () => {
      const command = {
        input: { order: 'asc' as const },
        state: { user: dummyUser },
      }

      const actual = await workflow(command)

      const actualNames = actual.map((entity) => entity.name)
      expect(actualNames).toStrictEqual([dummyTable1.name, dummyTable2.name])
    })
  })

  test('他人の項目は取得されないこと', async () => {
    const command = {
      input: { order: 'asc' as const },
      state: { user: anotherUser },
    }

    const actual = await workflow(command)
    expect(actual).toHaveLength(0)
  })

  test('降順で取得した場合、正しい順序で項目が取得できること', async () => {
    const command = {
      input: { order: 'desc' as const },
      state: { user: dummyUser },
    }

    const actual = await workflow(command)

    const actualNames = actual.map((entity) => entity.name)
    expect(actualNames).toStrictEqual([dummyTable2.name, dummyTable1.name])
  })
})
