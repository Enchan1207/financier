import { env } from 'cloudflare:test'
import { sign } from 'hono/jwt'
import { testClient } from 'hono/testing'

import { createFinancialYear } from '@/domains/financial_year/logic'
import { createIncomeDefinition } from '@/domains/income_definition/logic'
import { createIncomeRecord } from '@/domains/income_record/logic'
import { createStandardIncomeTable } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'

import { saveUser } from '@/dao/authorize'
import { insertFinancialYear } from '../financial_year/dao'
import { insertIncomeDefinition } from '../income_definition/dao'
import { insertStandardIncomeTable } from '@/dao/standard_income'
import { insertIncomeRecord } from './dao'
import income_records from './route'

describe('報酬実績API', () => {
  let token: string

  const client = testClient(income_records, env)

  const dummyUser: User = createUser({
    name: 'test user',
    email: 'test@example.com',
    auth0UserId: 'test_user',
  })

  const dummyTable = createStandardIncomeTable({
    userId: dummyUser.id,
    name: 'テスト用月額表',
    grades: [
      {
        threshold: 0,
        standardIncome: 88000,
      },
      {
        threshold: 93000,
        standardIncome: 98000,
      },
      {
        threshold: 101000,
        standardIncome: 104000,
      },
    ],
  })._unsafeUnwrap()

  const dummyYear = createFinancialYear({
    userId: dummyUser.id,
    financialYear: 2024,
    standardIncomeTableId: dummyTable.id,
  })._unsafeUnwrap()

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyApril = dummyYear.months.find(({ info }) => info.month === 4)!

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyJune = dummyYear.months.find(({ info }) => info.month === 6)!

  const dummyDefinition = createIncomeDefinition({
    userId: dummyUser.id,
    name: 'テスト',
    kind: 'absolute',
    value: 100000,
    isTaxable: true,
    from: dummyApril.info,
    to: dummyJune.info,
  })._unsafeUnwrap()

  const dummyRecord = createIncomeRecord({
    userId: dummyUser.id,
    financialMonthId: dummyApril.id,
    definitionId: dummyDefinition.id,
    value: 12345,
    updatedBy: 'user',
  })

  beforeAll(async () => {
    token = await sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        iss: `https://${env.AUTH_DOMAIN}/`,
        sub: dummyUser.auth0UserId,
        aud: [env.AUTH_AUDIENCE],
      },
      env.TEST_PRIVATE_KEY,
      'RS256',
    )

    await saveUser(env.D1)(dummyUser)
    await insertStandardIncomeTable(env.D1)(dummyTable)
    await insertFinancialYear(env.D1)(dummyYear)
    await insertIncomeDefinition(env.D1)(dummyDefinition)
    await insertIncomeRecord(env.D1)(dummyRecord)
  })

  test('4月度', async () => {
    const actual = await client[':financialYear'][':month'].$get(
      {
        param: {
          financialYear: '2024',
          month: '4',
        },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    const response = await actual.json()
    expect(response).toStrictEqual([
      {
        userId: dummyUser.id,
        value: 12345,
        name: 'テスト',
      },
    ])
  })

  test('5月度', async () => {
    const actual = await client[':financialYear'][':month'].$get(
      {
        param: {
          financialYear: '2024',
          month: '5',
        },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    const response = await actual.json()
    expect(response).toStrictEqual([
      {
        userId: dummyUser.id,
        value: 100000,
        name: 'テスト',
      },
    ])
  })
})
