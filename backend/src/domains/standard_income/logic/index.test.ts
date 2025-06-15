import { Ok } from 'neverthrow'

import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import { ValidationError } from '@/logic/errors'

import { createStandardIncomeTable } from '.'

const dummyUser: User = createUser({
  name: 'testuser',
  email: 'test@example.com',
  auth0UserId: 'auth0_test_user',
})

describe('異常系', () => {
  test('階級がない', () => {
    const actual = createStandardIncomeTable({
      userId: dummyUser.id,
      name: 'テスト',
      grades: [],
    })

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ValidationError)
  })

  test('負の値を含む', () => {
    const actual = createStandardIncomeTable({
      userId: dummyUser.id,
      name: 'テスト',
      grades: [
        {
          threshold: -1,
          standardIncome: -1,
        },
      ],
    })

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ValidationError)
  })

  test('非整数', () => {
    const actual = createStandardIncomeTable({
      userId: dummyUser.id,
      name: 'テスト',
      grades: [
        {
          threshold: 0,
          standardIncome: 1.234,
        },
      ],
    })

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ValidationError)
  })

  test('階級の最小値が非ゼロ', () => {
    const actual = createStandardIncomeTable({
      userId: dummyUser.id,
      name: 'テスト',
      grades: [
        {
          threshold: 1,
          standardIncome: 1,
        },
      ],
    })

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ValidationError)
  })

  test('階級における報酬額が閾値を下回る', () => {
    const actual = createStandardIncomeTable({
      userId: dummyUser.id,
      name: 'テスト',
      grades: [
        // 正常
        {
          threshold: 0,
          standardIncome: 100,
        },
        {
          threshold: 200,
          // 異常
          standardIncome: 150,
        },
      ],
    })

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ValidationError)
  })

  test('階級における閾値が前の報酬を下回る', () => {
    const actual = createStandardIncomeTable({
      userId: dummyUser.id,
      name: 'テスト',
      grades: [
        // 正常
        {
          threshold: 0,
          standardIncome: 200,
        },
        {
          // 異常
          threshold: 100,
          // 正常
          standardIncome: 300,
        },
      ],
    })

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ValidationError)
  })

  test('閾値 = 報酬額 = ゼロ', () => {
    const actual = createStandardIncomeTable({
      userId: dummyUser.id,
      name: 'テスト',
      grades: [
        {
          threshold: 0,
          standardIncome: 0,
        },
        {
          threshold: 0,
          standardIncome: 1,
        },
      ],
    })

    expect(actual._unsafeUnwrapErr()).toBeInstanceOf(ValidationError)
  })
})

describe('正常系', () => {
  test('単一の階級', () => {
    const actual = createStandardIncomeTable({
      userId: dummyUser.id,
      name: 'テスト',
      grades: [
        {
          threshold: 0,
          standardIncome: 200,
        },
      ],
    })

    expect(actual).toBeInstanceOf(Ok)
  })

  test('複数の階級', () => {
    const actual = createStandardIncomeTable({
      userId: dummyUser.id,
      name: 'テスト',
      grades: [
        {
          threshold: 0,
          standardIncome: 200,
        },
        {
          threshold: 300,
          standardIncome: 400,
        },
      ],
    })

    expect(actual).toBeInstanceOf(Ok)
  })

  test('閾値 = 標準報酬月額', () => {
    const actual = createStandardIncomeTable({
      userId: dummyUser.id,
      name: 'テスト',
      grades: [
        {
          threshold: 0,
          standardIncome: 200,
        },
        {
          threshold: 300,
          standardIncome: 300,
        },
      ],
    })

    expect(actual).toBeInstanceOf(Ok)
  })
})
