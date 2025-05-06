import { env } from 'cloudflare:test'

import { createFinancialYear } from '@/domains/financial_year/logic'
import { createIncomeDefinition } from '@/domains/income_definition/logic'
import { createUser } from '@/domains/user/logic'

import { saveUser } from '../authorize/dao'
import { insertFinancialYear } from '../financial_year/dao'
import { insertIncomeDefinition } from '../income_definition/dao'
import { findIncomeRecord, updateIncomeRecordValue } from './dao'

describe('報酬定義の操作', () => {
  const dummyUser = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_user_id',
  })

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    year: 2024,
  })

  const dummyFinancialMonth = dummyFinancialYear.months[0]

  const dummyIncomeDefinition = createIncomeDefinition({
    userId: dummyUser.id,
    kind: 'absolute',
    name: 'テスト定義',
    value: 100000,
    isTaxable: true,
    from: {
      financialYear: 2024,
      month: 4,
    },
    to: {
      financialYear: 2024,
      month: 3,
    },
  })._unsafeUnwrap()

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
    await insertIncomeDefinition(env.D1)(dummyIncomeDefinition)
  })

  test('挿入した項目を取得できること', async () => {
    const actual = await findIncomeRecord(env.D1)({
      financialMonthId: dummyFinancialMonth.id,
      definitionId: dummyIncomeDefinition.id,
    })

    expect(actual).toStrictEqual({
      userId: dummyUser.id,
      financialMonthId: dummyFinancialMonth.id,
      definitionId: dummyIncomeDefinition.id,
      value: 100000,
      updatedAt: actual?.updatedAt,
      updatedBy: 'system',
    })
  })

  test('項目を更新できること', async () => {
    const actual = await updateIncomeRecordValue(env.D1)({
      userId: dummyUser.id,
      financialMonthId: dummyFinancialMonth.id,
      definitionId: dummyIncomeDefinition.id,
      value: 200,
    })

    expect(actual).toStrictEqual(
      {
        userId: dummyUser.id,
        financialMonthId: dummyFinancialMonth.id,
        definitionId: dummyIncomeDefinition.id,
        updatedAt: actual?.updatedAt,
        value: 200,
        updatedBy: 'user',
      })
  })
})
