import { Err, Ok } from 'neverthrow'

import { createStandardIncomeTable } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'

import { createStandardIncomeTableDuplicateWorkflow } from './duplicate'

const dummyUser: User = createUser({
  name: 'testuser',
  email: 'test@example.com',
  auth0UserId: 'auth0_test_user',
})

describe('正常系', () => {
  const dummyTable = createStandardIncomeTable({
    userId: dummyUser.id,
    name: '既存テーブル',
    grades: [
      {
        threshold: 0,
        standardIncome: 10000,
      },
    ],
  })._unsafeUnwrap()

  const workflow = createStandardIncomeTableDuplicateWorkflow({
    // eslint-disable-next-line @typescript-eslint/require-await
    getStandardIncomeTable: async ({ id }) =>
      id === dummyTable.id ? dummyTable : undefined,
  })

  let actual: Awaited<ReturnType<typeof workflow>>

  beforeAll(async () => {
    actual = await workflow({
      input: {
        id: dummyTable.id,
        name: '複製済みのテーブル',
      },
      state: {
        user: dummyUser,
      },
    })
  })

  test('正常に完了すること', () => {
    expect(actual).toBeInstanceOf(Ok)
  })

  test('正常に複製されていること', () => {
    const duplicated = actual._unsafeUnwrap().entity

    expect(duplicated).toMatchObject({
      name: '複製済みのテーブル',
      grades: dummyTable.grades,
    })
  })
})

describe('異常系', () => {
  describe('テーブルが見つからない', () => {
    const dummyTable = createStandardIncomeTable({
      userId: dummyUser.id,
      name: '既存テーブル',
      grades: [
        {
          threshold: 0,
          standardIncome: 10000,
        },
      ],
    })._unsafeUnwrap()

    const workflow = createStandardIncomeTableDuplicateWorkflow({
      // eslint-disable-next-line @typescript-eslint/require-await
      getStandardIncomeTable: async () => undefined,
    })

    let actual: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      actual = await workflow({
        input: {
          id: dummyTable.id,
          name: '複製済みのテーブル',
        },
        state: {
          user: dummyUser,
        },
      })
    })

    test('エラーになること', () => {
      expect(actual).toBeInstanceOf(Err)
    })
  })

  describe('名前が不正', () => {
    const dummyTable = createStandardIncomeTable({
      userId: dummyUser.id,
      name: '既存テーブル',
      grades: [
        {
          threshold: 0,
          standardIncome: 10000,
        },
      ],
    })._unsafeUnwrap()

    const workflow = createStandardIncomeTableDuplicateWorkflow({
      // eslint-disable-next-line @typescript-eslint/require-await
      getStandardIncomeTable: async ({ id }) =>
        id === dummyTable.id ? dummyTable : undefined,
    })

    let actual: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      actual = await workflow({
        input: {
          id: dummyTable.id,
          name: '',
        },
        state: {
          user: dummyUser,
        },
      })
    })

    test('エラーになること', () => {
      expect(actual).toBeInstanceOf(Err)
    })
  })
})
