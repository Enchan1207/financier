import { env } from 'cloudflare:test'

import {
  createStandardIncomeGrade,
  createStandardIncomeTable,
} from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import { saveUser } from '@/features/authorize/dao'
import { EntityNotFoundError } from '@/logic/errors'

import { getStandardIncomeTable, insertStandardIncomeTable } from '../dao'
import { createStandardIncomeTableDuplicateWorkflow } from './duplicate'

describe('標準報酬月額表複製ワークフロー', () => {
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
    ].map((grade) => createStandardIncomeGrade(grade)._unsafeUnwrap()),
  })._unsafeUnwrap()

  const workflow = createStandardIncomeTableDuplicateWorkflow({
    getStandardIncomeTable: getStandardIncomeTable(env.D1),
  })

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await saveUser(env.D1)(anotherUser)
    await insertStandardIncomeTable(env.D1)(dummyEntity)
  })

  describe('自分の項目を複製できること', () => {
    let actual: ReturnType<
      Awaited<ReturnType<typeof workflow>>['_unsafeUnwrap']
    >['entity']

    beforeAll(async () => {
      const command = {
        input: {
          id: dummyEntity.id,
          name: 'duplicated table',
        },
        state: { user: dummyUser },
      }

      actual = (await workflow(command))._unsafeUnwrap().entity
    })

    test('idが変わっていること', () => {
      expect(actual.id).not.toBe(dummyEntity.id)
    })

    test('名前は入力値が採用されること', () => {
      expect(actual.name).toBe('duplicated table')
    })

    test('階級は完全に一致すること', () => {
      expect(actual.grades).toStrictEqual(dummyEntity.grades)
    })
  })

  test('存在しない項目は複製できないこと', async () => {
    const command = {
      input: {
        id: 'invalid_id',
        name: 'duplicated table',
      },
      state: { user: dummyUser },
    }

    const result = await workflow(command)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(EntityNotFoundError)
  })

  test('他人の項目は複製できないこと', async () => {
    const command = {
      input: {
        id: dummyEntity.id,
        name: 'duplicated table',
      },
      state: { user: anotherUser },
    }

    const result = await workflow(command)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(EntityNotFoundError)
  })
})
