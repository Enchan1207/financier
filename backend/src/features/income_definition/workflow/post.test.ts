import { env } from 'cloudflare:test'

import { createFinancialYear } from '@/domains/financial_year/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import { saveUser } from '@/features/authorize/dao'
import { insertFinancialYear } from '@/features/financial_year/dao'
import { ValidationError } from '@/logic/errors'

import type { PostIncomeDefinitionCommand } from './post'
import { createIncomeDefinitionPostWorkflow } from './post'

describe('収入定義作成ワークフロー', () => {
  const dummyUser: User = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    financialYear: 2025,
  })._unsafeUnwrap()

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyJune = dummyFinancialYear.months.find(({ month }) => month === 6)!

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyDecember = dummyFinancialYear.months.find(
    ({ month }) => month === 12,
  )!

  const workflow = createIncomeDefinitionPostWorkflow()

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
  })

  test('有効な収入定義を作成できること', () => {
    const command: PostIncomeDefinitionCommand = {
      input: {
        name: 'test income',
        kind: 'absolute',
        value: 100000,
        isTaxable: true,
        from: dummyJune,
        to: dummyDecember,
      },
      state: { user: dummyUser },
    }

    const result = workflow(command)
    expect(result.isOk()).toBeTruthy()
  })

  test('無効な収入定義を作成できないこと', () => {
    const command: PostIncomeDefinitionCommand = {
      input: {
        name: 'test income',
        kind: 'absolute',
        value: -100, // 値の不備はこのコマンドを作るところで弾いている
        isTaxable: true,
        from: dummyDecember,
        to: dummyJune, // INVALID! 期間が不正
      },
      state: { user: dummyUser },
    }

    const result = workflow(command)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(ValidationError)
  })
})
