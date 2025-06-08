import { env } from 'cloudflare:test'

import { createStandardIncomeGrade, createStandardIncomeTable } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import { saveUser } from '@/features/authorize/dao'
import { EntityNotFoundError, ValidationError } from '@/logic/errors'

import {
  getStandardIncomeTable,
  insertStandardIncomeTable,
} from '../dao'
import { createStandardIncomeTableGradesUpdateWorkflow } from './updateGrades'

describe('標準報酬月額表階級更新ワークフロー', () => {
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

  const workflow = createStandardIncomeTableGradesUpdateWorkflow({
    //
    getStandardIncomeTable: getStandardIncomeTable(env.D1),
  })

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await saveUser(env.D1)(anotherUser)
    await insertStandardIncomeTable(env.D1)(dummyEntity)
  })

  test('自分の項目の階級を更新できること', async () => {
    const command = {
      input: {
        id: dummyEntity.id,
        grades: [
          {
            threshold: 0,
            standardIncome: 100000,
          },
          {
            threshold: 110000,
            standardIncome: 120000,
          },
          {
            threshold: 130000,
            standardIncome: 140000,
          },
        ],
      },
      state: { user: dummyUser },
    }

    const { update: { grades } } = (await workflow(command))._unsafeUnwrap()
    expect(grades).toStrictEqual([
      {
        threshold: 0,
        standardIncome: 100000,
      },
      {
        threshold: 110000,
        standardIncome: 120000,
      },
      {
        threshold: 130000,
        standardIncome: 140000,
      },
    ])
  })

  test('階級の閾値が連続していない場合は更新できないこと', async () => {
    const command = {
      input: {
        id: dummyEntity.id,
        grades: [
          {
            threshold: 100000, // ゼロから始まっていない
            standardIncome: 100000,
          },
          {
            threshold: 110000,
            standardIncome: 120000,
          },
        ],
      },
      state: { user: dummyUser },
    }

    const result = await workflow(command)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(ValidationError)
  })

  test('階級の標準報酬月額が閾値より小さい場合は更新できないこと', async () => {
    const command = {
      input: {
        id: dummyEntity.id,
        grades: [
          {
            threshold: 0,
            standardIncome: 100000,
          },
          {
            threshold: 110000,
            standardIncome: 100000, // 前の階級より小さい
          },
        ],
      },
      state: { user: dummyUser },
    }

    const result = await workflow(command)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(ValidationError)
  })

  test('存在しない項目は更新できないこと', async () => {
    const command = {
      input: {
        id: 'invalid_id',
        grades: [
          {
            threshold: 0,
            standardIncome: 100000,
          },
        ],
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
        grades: [
          {
            threshold: 0,
            standardIncome: 100000,
          },
        ],
      },
      state: { user: anotherUser },
    }

    const result = await workflow(command)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(EntityNotFoundError)
  })
})
