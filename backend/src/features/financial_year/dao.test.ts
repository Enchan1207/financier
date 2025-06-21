import { env } from 'cloudflare:test'

import { saveUser } from '@/dao/authorize'
import { createFinancialMonthInfo } from '@/domains/financial_month_context/logic'
import type { FinancialYearValue } from '@/domains/financial_year'
import { createFinancialYear } from '@/domains/financial_year/logic'
import { createIncomeDefinition } from '@/domains/income_definition/logic'
import { createStandardIncomeTable } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'

import { insertIncomeDefinition } from '../income_definition/dao'
import { insertStandardIncomeTable } from '../standard_income/dao'
import {
  getFinancialYear,
  insertFinancialYear,
  listFinancialYears,
} from './dao'

const dummyUser: User = createUser({
  name: 't_est_user',
  email: 'test@example.com',
  auth0UserId: 'auth0_test_user',
})

describe('会計年度の生成', () => {
  const dummyStandardIncomeTable = createStandardIncomeTable({
    userId: dummyUser.id,
    name: 'テスト',
    grades: [
      {
        threshold: 0,
        standardIncome: 10000,
      },
    ],
  })._unsafeUnwrap()

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    financialYear: 2024,
    standardIncomeTableId: dummyStandardIncomeTable.id,
  })._unsafeUnwrap()

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertStandardIncomeTable(env.D1)(dummyStandardIncomeTable)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
  })

  test('12個の会計月度エンティティが登録されていること', async () => {
    const stmt = 'SELECT COUNT(*) count FROM financial_month_contexts'
    const result = await env.D1.prepare(stmt).first<{ count: number }>()
    expect(result?.count).toBe(12)
  })

  test('報酬実績は生成されないこと', async () => {
    const stmt = 'SELECT COUNT(*) count FROM income_records'
    const result = await env.D1.prepare(stmt).first<{ count: number }>()
    expect(result?.count).toBe(0)
  })
})

describe('会計年度の取得', () => {
  const dummyStandardIncomeTable = createStandardIncomeTable({
    userId: dummyUser.id,
    name: 'テスト',
    grades: [
      {
        threshold: 0,
        standardIncome: 10000,
      },
    ],
  })._unsafeUnwrap()

  const dummyFinancialYears = [2024, 2023, 2025].map((year) =>
    createFinancialYear({
      userId: dummyUser.id,
      financialYear: year,
      standardIncomeTableId: dummyStandardIncomeTable.id,
    })._unsafeUnwrap(),
  )

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertStandardIncomeTable(env.D1)(dummyStandardIncomeTable)

    const insert = insertFinancialYear(env.D1)
    await Promise.all(dummyFinancialYears.map(insert))
  })

  test('3件取得できること', async () => {
    const entities = await listFinancialYears(env.D1)({
      userId: dummyUser.id,
      order: 'desc',
    })

    expect(entities).toStrictEqual([2025, 2024, 2023])
  })

  test('単一の会計年度を取得できること', async () => {
    const entity = await getFinancialYear(env.D1)({
      userId: dummyUser.id,
      financialYear: 2023 as FinancialYearValue,
    })

    expect(entity?.year).toBe(2023)
  })

  test('存在しないなら取得できないこと', async () => {
    const entity = await getFinancialYear(env.D1)({
      userId: dummyUser.id,
      financialYear: 2026 as FinancialYearValue,
    })

    expect(entity).toBeUndefined()
  })
})

describe('報酬定義が存在する場合', () => {
  const dummyDefinition1 = createIncomeDefinition({
    userId: dummyUser.id,
    name: 'テスト',
    kind: 'absolute',
    value: 123456,
    isTaxable: true,
    from: createFinancialMonthInfo({
      financialYear: 2024,
      month: 9,
    })._unsafeUnwrap(),
    to: createFinancialMonthInfo({
      financialYear: 2025,
      month: 9,
    })._unsafeUnwrap(),
  })._unsafeUnwrap()

  const dummyDefinition2 = createIncomeDefinition({
    userId: dummyUser.id,
    name: 'テスト',
    kind: 'related_by_workday',
    value: 123,
    isTaxable: true,
    from: createFinancialMonthInfo({
      financialYear: 2024,
      month: 4,
    })._unsafeUnwrap(),
    to: createFinancialMonthInfo({
      financialYear: 2024,
      month: 3,
    })._unsafeUnwrap(),
  })._unsafeUnwrap()

  const dummyDefinition3 = createIncomeDefinition({
    userId: dummyUser.id,
    name: 'テスト',
    kind: 'related_by_workday',
    value: 123,
    isTaxable: true,
    from: createFinancialMonthInfo({
      financialYear: 2025,
      month: 4,
    })._unsafeUnwrap(),
    to: createFinancialMonthInfo({
      financialYear: 2025,
      month: 3,
    })._unsafeUnwrap(),
  })._unsafeUnwrap()

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await Promise.all(
      [dummyDefinition1, dummyDefinition2, dummyDefinition3].map(
        insertIncomeDefinition(env.D1),
      ),
    )
  })

  describe('2024年度を挿入した場合', () => {
    const dummyStandardIncomeTable = createStandardIncomeTable({
      userId: dummyUser.id,
      name: 'テスト',
      grades: [
        {
          threshold: 0,
          standardIncome: 10000,
        },
      ],
    })._unsafeUnwrap()

    const dummyFinancialYear = createFinancialYear({
      userId: dummyUser.id,
      financialYear: 2024,
      standardIncomeTableId: dummyStandardIncomeTable.id,
    })._unsafeUnwrap()

    beforeAll(async () => {
      await insertStandardIncomeTable(env.D1)(dummyStandardIncomeTable)
      await insertFinancialYear(env.D1)(dummyFinancialYear)
    })

    test('報酬実績は生成されないこと', async () => {
      const stmt = 'SELECT COUNT(*) count FROM income_records'
      const result = await env.D1.prepare(stmt).first<{ count: number }>()
      expect(result?.count).toBe(0)
    })
  })

  describe('2025年度を挿入した場合', () => {
    const dummyStandardIncomeTable = createStandardIncomeTable({
      userId: dummyUser.id,
      name: 'テスト',
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

    beforeAll(async () => {
      await insertStandardIncomeTable(env.D1)(dummyStandardIncomeTable)
      await insertFinancialYear(env.D1)(dummyFinancialYear)
    })

    test('報酬実績は生成されないこと', async () => {
      const stmt = 'SELECT COUNT(*) count FROM income_records'
      const result = await env.D1.prepare(stmt).first<{ count: number }>()
      expect(result?.count).toBe(0)
    })
  })

  describe('2024年度と2025年度を挿入した場合', () => {
    const dummyStandardIncomeTable = createStandardIncomeTable({
      userId: dummyUser.id,
      name: 'テスト',
      grades: [
        {
          threshold: 0,
          standardIncome: 10000,
        },
      ],
    })._unsafeUnwrap()

    const dummyFinancialYear24 = createFinancialYear({
      userId: dummyUser.id,
      financialYear: 2024,
      standardIncomeTableId: dummyStandardIncomeTable.id,
    })._unsafeUnwrap()

    const dummyFinancialYear25 = createFinancialYear({
      userId: dummyUser.id,
      financialYear: 2025,
      standardIncomeTableId: dummyStandardIncomeTable.id,
    })._unsafeUnwrap()

    beforeAll(async () => {
      await insertStandardIncomeTable(env.D1)(dummyStandardIncomeTable)
      await insertFinancialYear(env.D1)(dummyFinancialYear24)
      await insertFinancialYear(env.D1)(dummyFinancialYear25)
    })

    test('報酬実績は生成されないこと', async () => {
      const stmt = 'SELECT COUNT(*) count FROM income_records'
      const result = await env.D1.prepare(stmt).first<{ count: number }>()
      expect(result?.count).toBe(0)
    })
  })
})
