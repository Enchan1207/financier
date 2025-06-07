import { env } from 'cloudflare:test'

import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import { saveUser } from '@/features/authorize/dao'
import { ValidationError } from '@/logic/errors'

import { createStandardIncomeTablePostWorkflow } from './post'

describe('標準報酬月額表作成ワークフロー', () => {
  const dummyUser: User = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const workflow = createStandardIncomeTablePostWorkflow()

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
  })

  test('有効な標準報酬月額表を作成できること', () => {
    const command = {
      input: {
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
        ],
      },
      state: { user: dummyUser },
    }

    const result = workflow(command)
    expect(result.isOk()).toBeTruthy()
  })

  test('階級の閾値が連続していない場合は作成できないこと', () => {
    const command = {
      input: {
        name: 'invalid table',
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

    const result = workflow(command)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(ValidationError)
  })

  test('階級の標準報酬月額が閾値より小さい場合は作成できないこと', () => {
    const command = {
      input: {
        name: 'invalid table',
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

    const result = workflow(command)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(ValidationError)
  })
})
