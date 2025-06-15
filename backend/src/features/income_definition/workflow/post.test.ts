import { Ok } from 'neverthrow'

import { createFinancialYear } from '@/domains/financial_year/logic'
import { createStandardIncomeTable } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import { ValidationError } from '@/logic/errors'

import type { PostIncomeDefinitionCommand } from './post'
import { createIncomeDefinitionPostWorkflow } from './post'

describe('収入定義の作成', () => {
  const dummyUser: User = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyStandardIncomeTable = createStandardIncomeTable({
    userId: dummyUser.id,
    name: '',
    grades: [
      {
        threshold: 0,
        standardIncome: 10000,
      },
    ],
  })._unsafeUnwrap()

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    financialYear: 2025,
    standardIncomeTableId: dummyStandardIncomeTable.id,
  })._unsafeUnwrap()

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyJune = dummyFinancialYear.months.find(
    ({ info: { month } }) => month === 6,
  )!

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyDecember = dummyFinancialYear.months.find(
    ({ info: { month } }) => month === 12,
  )!

  const workflow = createIncomeDefinitionPostWorkflow()

  test('正常系', () => {
    const command: PostIncomeDefinitionCommand = {
      input: {
        name: 'test income',
        kind: 'absolute',
        value: 100000,
        isTaxable: true,
        from: dummyJune.info,
        to: dummyDecember.info,
      },
      state: { user: dummyUser },
    }

    const result = workflow(command)
    expect(result).toBeInstanceOf(Ok)
  })

  test('異常系', () => {
    const command: PostIncomeDefinitionCommand = {
      input: {
        name: 'test income',
        kind: 'absolute',
        value: -100, // 値の不備はこのコマンドを作るところで弾いている
        isTaxable: true,
        from: dummyDecember.info,
        to: dummyJune.info, // INVALID! 期間が不正
      },
      state: { user: dummyUser },
    }

    const result = workflow(command)
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(ValidationError)
  })
})
