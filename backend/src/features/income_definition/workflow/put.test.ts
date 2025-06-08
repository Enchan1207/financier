import { createFinancialYear } from '@/domains/financial_year/logic'
import { createIncomeDefinition } from '@/domains/income_definition/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import { EntityNotFoundError } from '@/logic/errors'

import { createIncomeDefinitionPutWorkflow } from './put'

describe('収入定義更新ワークフロー', () => {
  const dummyUser: User = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    year: 2025,
  })._unsafeUnwrap()

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyApril = dummyFinancialYear.months.find(({ month }) => month === 4)!

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummySeptember = dummyFinancialYear.months.find(
    ({ month }) => month === 9,
  )!

  const dummyDefinition = createIncomeDefinition({
    userId: dummyUser.id,
    name: '手当1',
    kind: 'related_by_workday',
    value: 350,
    isTaxable: true,
    from: dummyApril,
    to: dummySeptember,
  })._unsafeUnwrap()

  const workflow = createIncomeDefinitionPutWorkflow({
    // eslint-disable-next-line @typescript-eslint/require-await
    getIncomeDefinitionById: async (_, id) => {
      return id === dummyDefinition.id ? dummyDefinition : undefined
    },
  })

  test('収入定義を更新できること', async () => {
    const command = {
      input: {
        name: 'updated income',
        value: 60000,
      },
      state: {
        id: dummyDefinition.id,
        user: dummyUser,
      },
    }

    const result = await workflow(command)
    expect(result.isOk()).toBeTruthy()
    const event = result._unsafeUnwrap()
    expect(event.update.name).toBe('updated income')
    expect(event.update.value).toBe(60000)
  })

  test('存在しない収入定義を更新できないこと', async () => {
    const command = {
      input: {
        name: 'nonexistent income',
      },
      state: {
        id: 'invalid-id',
        user: dummyUser,
      },
    }

    const result = await workflow(command)
    expect(result.isErr()).toBeTruthy()
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(EntityNotFoundError)
  })
})
