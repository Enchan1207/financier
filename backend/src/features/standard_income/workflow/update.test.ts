import { createStandardIncomeTable } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'

import { createStandardIncomeTableUpdateWorkflow } from './update'

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

  const workflow = createStandardIncomeTableUpdateWorkflow()

  test('名前の更新', () => {
    const result = workflow({
      input: {
        id: dummyTable.id,
        name: '更新後の名前',
      },
      state: {
        user: dummyUser,
      },
    })._unsafeUnwrap()

    expect(result).toStrictEqual({
      id: dummyTable.id,
      userId: dummyUser.id,
      kind: 'name',
      name: '更新後の名前',
    })
  })

  test('階級の更新', () => {
    const result = workflow({
      input: {
        id: dummyTable.id,
        grades: [
          {
            threshold: 0,
            standardIncome: 10000,
          },
          {
            threshold: 15000,
            standardIncome: 20000,
          },
        ],
      },
      state: {
        user: dummyUser,
      },
    })._unsafeUnwrap()

    expect(result).toStrictEqual({
      id: dummyTable.id,
      userId: dummyUser.id,
      kind: 'grades',
      grades: [
        {
          threshold: 0,
          standardIncome: 10000,
        },
        {
          threshold: 15000,
          standardIncome: 20000,
        },
      ],
    })
  })
})
