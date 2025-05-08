import { env } from 'cloudflare:test'

import { createFinancialMonthData } from '@/domains/financial_month/logic'
import { createFinancialYear } from '@/domains/financial_year/logic'
import { createIncomeDefinition } from '@/domains/income_definition/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import type { WorkdayValue } from '@/domains/workday/logic'

import { saveUser } from '../authorize/dao'
import { insertFinancialYear } from '../financial_year/dao'
import { insertIncomeDefinition } from '../income_definition/dao'
import { updateIncomeRecordValue } from '../income_record/dao'
import { findWorkdayByFinancialMonthId, updateWorkday } from './dao'

describe('勤務日数エントリの操作', () => {
  const dummyUser: User = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    year: 2025,
  })._unsafeUnwrap()

  const dummyFinancialMonth = dummyFinancialYear.months[0]

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
  })

  test('会計月度IDからエンティティを取得できること', async () => {
    const actual
     = await findWorkdayByFinancialMonthId(env.D1)(dummyFinancialMonth.id)
    expect(actual).toBeDefined()
  })

  test('項目を更新できること', async () => {
    await updateWorkday(env.D1)({
      userId: dummyUser.id,
      financialMonthId: dummyFinancialMonth.id,
      count: 17 as WorkdayValue,
    })

    const actual
    = await findWorkdayByFinancialMonthId(env.D1)(dummyFinancialMonth.id)
    expect({
      ...actual,
      updatedAt: actual?.updatedAt.valueOf(),
    }).toStrictEqual({
      ...actual,
      count: 17,
      updatedAt: actual?.updatedAt.valueOf(),
    })
  })
})

describe('勤務日数更新時の報酬実績', () => {
  const dummyUser: User = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    year: 2025,
  })._unsafeUnwrap()

  const dummyAbsoluteIncomeDefinition = createIncomeDefinition({
    userId: dummyUser.id,
    name: '',
    kind: 'absolute',
    value: 500,
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

  const dummyRelativeIncomeDefinition = createIncomeDefinition({
    userId: dummyUser.id,
    name: '',
    kind: 'related_by_workday',
    value: 300,
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
    await insertFinancialYear(env.D1)(dummyFinancialYear)
    await insertIncomeDefinition(env.D1)(dummyAbsoluteIncomeDefinition)
    await insertIncomeDefinition(env.D1)(dummyRelativeIncomeDefinition)
  })

  test('24件の報酬実績が登録されていること', async () => {
    const actual = await env.D1
      .prepare('SELECT COUNT(*) count FROM income_records WHERE user_id=?')
      .bind(dummyUser.id)
      .first<{ count: number }>()

    expect(actual?.count).toBe(24)
  })

  describe('4月度の勤務日数を変更した場合', () => {
    beforeAll(async () => {
      await updateWorkday(env.D1)({
        userId: dummyUser.id,
        financialMonthId: dummyFinancialYear.months[0].id,
        count: 10 as WorkdayValue,
      })
    })

    test('報酬実績レコードの数は変わらないこと', async () => {
      const actual = await env.D1
        .prepare('SELECT COUNT(*) count FROM income_records WHERE user_id=?')
        .bind(dummyUser.id)
        .first<{ count: number }>()

      expect(actual?.count).toBe(24)
    })

    describe('4月分の報酬実績', () => {
      let records: Record<string, unknown>[]

      beforeAll(async () => {
        const stmt = `SELECT * FROM income_records WHERE user_id=? AND financial_month_id=?`
        const { results } = await env.D1
          .prepare(stmt)
          .bind(
            dummyUser.id,
            dummyFinancialYear.months[0].id,
          )
          .all()
        records = results
      })

      test('2件登録されていること', () => {
        expect(records).toHaveLength(2)
      })

      test('定数実績は更新されていないこと', () => {
        const { id } = dummyAbsoluteIncomeDefinition
        const absoluteRecord = records.find(record => record.definition_id === id)

        expect(absoluteRecord?.value).toBe(500)
      })

      test('勤務日数に連動する実績は更新されていること', () => {
        const { id } = dummyRelativeIncomeDefinition
        const relativeRecord = records.find(record => record.definition_id === id)

        expect(relativeRecord?.value).toBe(3000)
      })
    })

    describe('5月分の報酬実績', () => {
      let records: Record<string, unknown>[]

      beforeAll(async () => {
        const stmt = `SELECT * FROM income_records WHERE user_id=? AND financial_month_id=?`
        const { results } = await env.D1
          .prepare(stmt)
          .bind(
            dummyUser.id,
            dummyFinancialYear.months[1].id,
          )
          .all()
        records = results
      })

      test('2件登録されていること', () => {
        expect(records).toHaveLength(2)
      })

      test('勤務日数に連動する実績は更新されていないこと', () => {
        const { id } = dummyRelativeIncomeDefinition
        const relativeRecord = records.find(record => record.definition_id === id)

        expect(relativeRecord?.value).toBe(6000)
      })
    })
  })

  describe('ユーザが実績を修正してから勤務日数が変更された場合', () => {
    beforeAll(async () => {
      await updateIncomeRecordValue(env.D1)({
        userId: dummyUser.id,
        financialMonthId: dummyFinancialYear.months[0].id,
        definitionId: dummyRelativeIncomeDefinition.id,
        value: 1234,
      })

      await updateWorkday(env.D1)({
        userId: dummyUser.id,
        financialMonthId: dummyFinancialYear.months[0].id,
        count: 10 as WorkdayValue,
      })
    })

    test('報酬実績レコードの数は変わらないこと', async () => {
      const actual = await env.D1
        .prepare('SELECT COUNT(*) count FROM income_records WHERE user_id=?')
        .bind(dummyUser.id)
        .first<{ count: number }>()

      expect(actual?.count).toBe(24)
    })

    describe('4月分の報酬実績', () => {
      let records: Record<string, unknown>[]

      beforeAll(async () => {
        const stmt = `SELECT * FROM income_records WHERE user_id=? AND financial_month_id=?`
        const { results } = await env.D1
          .prepare(stmt)
          .bind(
            dummyUser.id,
            dummyFinancialYear.months[0].id,
          )
          .all()
        records = results
      })

      test('2件登録されていること', () => {
        expect(records).toHaveLength(2)
      })

      test('定数実績は更新されていないこと', () => {
        const { id } = dummyAbsoluteIncomeDefinition
        const absoluteRecord = records.find(record => record.definition_id === id)

        expect(absoluteRecord?.value).toBe(500)
      })

      test('勤務日数に連動する実績は更新されていないこと', () => {
        const { id } = dummyRelativeIncomeDefinition
        const relativeRecord = records.find(record => record.definition_id === id)

        expect(relativeRecord?.value).toBe(1234)
      })
    })

    describe('5月分の報酬実績', () => {
      let records: Record<string, unknown>[]

      beforeAll(async () => {
        const stmt = `SELECT * FROM income_records WHERE user_id=? AND financial_month_id=?`
        const { results } = await env.D1
          .prepare(stmt)
          .bind(
            dummyUser.id,
            dummyFinancialYear.months[1].id,
          )
          .all()
        records = results
      })

      test('2件登録されていること', () => {
        expect(records).toHaveLength(2)
      })

      test('勤務日数に連動する実績は更新されていないこと', () => {
        const { id } = dummyRelativeIncomeDefinition
        const relativeRecord = records.find(record => record.definition_id === id)

        expect(relativeRecord?.value).toBe(6000)
      })
    })
  })
})
