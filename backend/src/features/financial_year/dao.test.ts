import { env } from 'cloudflare:test'
import type { z } from 'zod'

import { createFinancialMonthData } from '@/domains/financial_month/logic'
import type { FinancialYearValue } from '@/domains/financial_year'
import { createFinancialYear } from '@/domains/financial_year/logic'
import { createIncomeDefinition } from '@/domains/income_definition/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'

import { saveUser } from '../authorize/dao'
import { insertIncomeDefinition } from '../income_definition/dao'
import type { IncomeRecordRecord } from '../income_record/dao'
import {
  getFinancialYear, insertFinancialYear, listFinancialYears,
} from './dao'

describe('会計年度の生成', () => {
  const dummyUser: User = createUser({
    name: 't_est_user',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    year: 2024,
  })._unsafeUnwrap()

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
  })

  test('12個の会計月度エンティティが登録されていること', async () => {
    const stmt = 'SELECT COUNT(*) count FROM financial_months'
    const result = await env.D1.prepare(stmt).first<{ count: number }>()
    expect(result?.count).toBe(12)
  })

  test('12個の勤務日数エンティティが登録されていること', async () => {
    const stmt = 'SELECT COUNT(*) count FROM workdays'
    const result = await env.D1.prepare(stmt).first<{ count: number }>()
    expect(result?.count).toBe(12)
  })

  test('報酬定義がないので実績は生成されないこと', async () => {
    const stmt = 'SELECT COUNT(*) count FROM income_records'
    const result = await env.D1.prepare(stmt).first<{ count: number }>()
    expect(result?.count).toBe(0)
  })
})

describe('会計年度の取得', () => {
  const dummyUser: User = createUser({
    name: 't_est_user',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyFinancialYears = [2024, 2023, 2025].map(year =>
    createFinancialYear({
      userId: dummyUser.id,
      year,
    })._unsafeUnwrap(),
  )

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)

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
  const dummyUser: User = createUser({
    name: 't_est_user',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyDefinition1 = createIncomeDefinition({
    userId: dummyUser.id,
    name: '',
    kind: 'absolute',
    value: 123456,
    isTaxable: true,
    from: createFinancialMonthData({
      financialYear: 2024,
      month: 9,
    })._unsafeUnwrap(),
    to: createFinancialMonthData({
      financialYear: 2025,
      month: 9,
    })._unsafeUnwrap(),
  })._unsafeUnwrap()

  const dummyDefinition2 = createIncomeDefinition({
    userId: dummyUser.id,
    name: '',
    kind: 'related_by_workday',
    value: 123,
    isTaxable: true,
    from: createFinancialMonthData({
      financialYear: 2024,
      month: 4,
    })._unsafeUnwrap(),
    to: createFinancialMonthData({
      financialYear: 2024,
      month: 3,
    })._unsafeUnwrap(),
  })._unsafeUnwrap()

  const dummyDefinition3 = createIncomeDefinition({
    userId: dummyUser.id,
    name: '',
    kind: 'related_by_workday',
    value: 123,
    isTaxable: true,
    from: createFinancialMonthData({
      financialYear: 2025,
      month: 4,
    })._unsafeUnwrap(),
    to: createFinancialMonthData({
      financialYear: 2025,
      month: 3,
    })._unsafeUnwrap(),
  })._unsafeUnwrap()

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await Promise.all([
      dummyDefinition1,
      dummyDefinition2,
      dummyDefinition3].map(insertIncomeDefinition(env.D1)))
  })

  describe('2024年度を挿入した場合', () => {
    const dummyFinancialYear = createFinancialYear({
      userId: dummyUser.id,
      year: 2024,
    })._unsafeUnwrap()

    let records: z.infer<typeof IncomeRecordRecord>[]

    beforeAll(async () => {
      await insertFinancialYear(env.D1)(dummyFinancialYear)

      const stmt = 'SELECT * FROM income_records WHERE user_id=?'
      const { results } = await env.D1
        .prepare(stmt)
        .bind(dummyUser.id)
        .all<z.infer<typeof IncomeRecordRecord>>()
      records = results
    })

    test('FY24-09 ~ FY25-09 までに定義された7件の実績が記録されること', () => {
      const actual = records.filter(record => record.definition_id === dummyDefinition1.id)
      expect(actual).toHaveLength(7)
    })

    test('FY24全体に定義された12件の実績が記録されること', () => {
      const actual = records.filter(record => record.definition_id === dummyDefinition2.id)
      expect(actual).toHaveLength(12)
    })

    test('FY25全体に定義された0件の実績が記録されること', () => {
      const actual = records.filter(record => record.definition_id === dummyDefinition3.id)
      expect(actual).toHaveLength(0)
    })

    test('実績の合計レコード数は19であること', () => {
      expect(records).toHaveLength(19)
    })
  })

  describe('2025年度を挿入した場合', () => {
    const dummyFinancialYear = createFinancialYear({
      userId: dummyUser.id,
      year: 2025,
    })._unsafeUnwrap()

    let records: z.infer<typeof IncomeRecordRecord>[]

    beforeAll(async () => {
      await insertFinancialYear(env.D1)(dummyFinancialYear)

      const stmt = 'SELECT * FROM income_records WHERE user_id=?'
      const { results } = await env.D1
        .prepare(stmt)
        .bind(dummyUser.id)
        .all<z.infer<typeof IncomeRecordRecord>>()
      records = results
    })

    test('FY24-09 ~ FY25-09 までに定義された6件の実績が記録されること', () => {
      const actual = records.filter(record => record.definition_id === dummyDefinition1.id)
      expect(actual).toHaveLength(6)
    })

    test('FY24全体に定義された0件の実績が記録されること', () => {
      const actual = records.filter(record => record.definition_id === dummyDefinition2.id)
      expect(actual).toHaveLength(0)
    })

    test('FY25全体に定義された12件の実績が記録されること', () => {
      const actual = records.filter(record => record.definition_id === dummyDefinition3.id)
      expect(actual).toHaveLength(12)
    })

    test('実績の合計レコード数は18であること', () => {
      expect(records).toHaveLength(18)
    })
  })

  describe('2024年度と2025年度を挿入した場合', () => {
    const dummyFinancialYear24 = createFinancialYear({
      userId: dummyUser.id,
      year: 2024,
    })._unsafeUnwrap()

    const dummyFinancialYear25 = createFinancialYear({
      userId: dummyUser.id,
      year: 2025,
    })._unsafeUnwrap()

    let records: z.infer<typeof IncomeRecordRecord>[]

    beforeAll(async () => {
      await insertFinancialYear(env.D1)(dummyFinancialYear24)
      await insertFinancialYear(env.D1)(dummyFinancialYear25)

      const stmt = 'SELECT * FROM income_records WHERE user_id=?'
      const { results } = await env.D1
        .prepare(stmt)
        .bind(dummyUser.id)
        .all<z.infer<typeof IncomeRecordRecord>>()
      records = results
    })

    test('FY24-09 ~ FY25-09 までに定義された13件の実績が記録されること', () => {
      const actual = records.filter(record => record.definition_id === dummyDefinition1.id)
      expect(actual).toHaveLength(13)
    })

    test('FY24全体に定義された12件の実績が記録されること', () => {
      const actual = records.filter(record => record.definition_id === dummyDefinition2.id)
      expect(actual).toHaveLength(12)
    })

    test('FY25全体に定義された12件の実績が記録されること', () => {
      const actual = records.filter(record => record.definition_id === dummyDefinition3.id)
      expect(actual).toHaveLength(12)
    })

    test('実績の合計レコード数は37であること', () => {
      expect(records).toHaveLength(37)
    })
  })
})
