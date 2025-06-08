import { env } from 'cloudflare:test'

import { createStandardIncomeGrade, createStandardIncomeTable } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import { saveUser } from '@/features/authorize/dao'
import { EntityNotFoundError } from '@/logic/errors'

import {
  getStandardIncomeTable,
  insertStandardIncomeTable,
} from '../dao'
import { createStandardIncomeTableNameUpdateWorkflow } from './updateName'

describe('標準報酬月額表名更新ワークフロー', () => {
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
        standardIncome: 100000,
      },
      {
        threshold: 110000,
        standardIncome: 120000,
      },
    ].map(grade => createStandardIncomeGrade(grade)._unsafeUnwrap()),
  })._unsafeUnwrap()

  const workflow = createStandardIncomeTableNameUpdateWorkflow({
    //
    getStandardIncomeTable: getStandardIncomeTable(env.D1),
  })

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await saveUser(env.D1)(anotherUser)
    await insertStandardIncomeTable(env.D1)(dummyEntity)
  })

  test('自分の項目の名前を更新できること', async () => {
    const command = {
      input: {
        id: dummyEntity.id,
        name: 'updated name',
      },
      state: { user: dummyUser },
    }

    const result = (await workflow(command))._unsafeUnwrap()
    expect(result.update.name).toBe('updated name')
  })

  test('存在しない項目は更新できないこと', async () => {
    const command = {
      input: {
        id: 'invalid_id',
        name: 'updated name',
      },
      state: { user: dummyUser },
    }

    const result = await workflow(command)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(EntityNotFoundError)
  })

  test('他人の項目は更新できないこと', async () => {
    const command = {
      input: {
        id: dummyEntity.id,
        name: 'updated name',
      },
      state: { user: anotherUser },
    }

    const result = await workflow(command)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(EntityNotFoundError)
  })
})
