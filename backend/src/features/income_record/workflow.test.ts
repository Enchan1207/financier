import { Err, Ok } from 'neverthrow'

import { createFinancialYear } from '@/domains/financial_year/logic'
import { createUser } from '@/domains/user/logic'

import { createIncomeRecordListWorkflow } from './workflow'

describe('正常系', () => {
  const dummyUser = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_user_id',
  })

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    financialYear: 2024,
    standardIncomeTableId: '',
  })._unsafeUnwrap()

  const workflow = createIncomeRecordListWorkflow({
    // eslint-disable-next-line @typescript-eslint/require-await
    getFinancialMonthContext: async (props) => {
      return dummyFinancialYear.months.find(
        ({ info }) =>
          info.financialYear === props.info.financialYear &&
          info.month === props.info.month,
      )
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    listIncomeRecordItems: async () => [],
  })

  test('ワークフローが正常終了すること', async () => {
    const actual = await workflow({
      input: {
        financialYear: 2024,
        month: 5,
      },
      state: {
        user: dummyUser,
      },
    })

    expect(actual).toBeInstanceOf(Ok)
  })
})

describe('異常系 - 不正な会計月度指定', () => {
  const dummyUser = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_user_id',
  })

  const workflow = createIncomeRecordListWorkflow({
    // eslint-disable-next-line @typescript-eslint/require-await
    getFinancialMonthContext: async () => undefined,
    // eslint-disable-next-line @typescript-eslint/require-await
    listIncomeRecordItems: async () => [],
  })

  test('ワークフローがエラーになること', async () => {
    const actual = await workflow({
      input: {
        financialYear: 2024,
        month: 5,
      },
      state: {
        user: dummyUser,
      },
    })

    expect(actual).toBeInstanceOf(Err)
  })
})
