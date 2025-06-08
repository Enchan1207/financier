import { env } from 'cloudflare:test'

import { createStandardIncomeGrade, createStandardIncomeTable } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import { saveUser } from '@/features/authorize/dao'
import { EntityNotFoundError } from '@/logic/errors'

import { getStandardIncomeTable, insertStandardIncomeTable } from '../dao'
import { createStandardIncomeTableGetWorkflow } from './get'

describe('標準報酬月額表取得ワークフロー', () => {
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

  const dummyEntity = createStandardIncomeTable({
    userId: dummyUser.id,
    name: 'test table',
    grades: [
      {
        threshold: 0,
        standardIncome: 50000,
      },
      {
        threshold: 100000,
        standardIncome: 100000,
      },
      {
        threshold: 200000,
        standardIncome: 200000,
      },
    ].map(grade => createStandardIncomeGrade(grade)._unsafeUnwrap()),
  })._unsafeUnwrap()

  const workflow = createStandardIncomeTableGetWorkflow({
    //
    getStandardIncomeTable: getStandardIncomeTable(env.D1),
  })

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await saveUser(env.D1)(anotherUser)
    await insertStandardIncomeTable(env.D1)(dummyEntity)
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
    expect(actual).toStrictEqual(dummyEntity)
  })
})
