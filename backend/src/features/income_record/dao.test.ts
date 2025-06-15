import { env } from 'cloudflare:test'

import { createFinancialMonthInfo } from '@/domains/financial_month_context/logic'
import { createFinancialYear } from '@/domains/financial_year/logic'
import { createIncomeDefinition } from '@/domains/income_definition/logic'
import type { IncomeRecord } from '@/domains/income_record'
import { createIncomeRecord } from '@/domains/income_record/logic'
import { createStandardIncomeTable } from '@/domains/standard_income/logic'
import { createUser } from '@/domains/user/logic'

import { saveUser } from '../authorize/dao'
import { insertFinancialYear } from '../financial_year/dao'
import { insertIncomeDefinition } from '../income_definition/dao'
import { insertStandardIncomeTable } from '../standard_income/dao'
import {
  findIncomeRecord,
  insertIncomeRecord,
  listIncomeRecordItems,
  resetIncomeRecordValue,
  updateIncomeRecordValue,
} from './dao'

describe('報酬実績の操作', () => {
  const dummyUser = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_user_id',
  })

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

  const dummyFinancialMonth1 = dummyFinancialYear.months[0]
  const dummyFinancialMonth2 = dummyFinancialYear.months[1]

  const dummyIncomeDefinition = createIncomeDefinition({
    userId: dummyUser.id,
    kind: 'absolute',
    name: 'テスト定義',
    value: 100000,
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

  const dummyIncomeRecord = createIncomeRecord({
    userId: dummyUser.id,
    financialMonthId: dummyFinancialMonth1.id,
    definitionId: dummyIncomeDefinition.id,
    value: 100,
    updatedBy: 'user',
  })

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertStandardIncomeTable(env.D1)(dummyStandardIncomeTable)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
    await insertIncomeDefinition(env.D1)(dummyIncomeDefinition)

    // ユーザが挿入したテイで実績を追加する
    await insertIncomeRecord(env.D1)(dummyIncomeRecord)
  })

  test('実績レコードは1件しか存在しないこと', async () => {
    const stmt = 'SELECT COUNT(*) count FROM income_records'
    const result = await env.D1.prepare(stmt).first<{ count: number }>()
    expect(result?.count).toBe(1)
  })

  describe('既存の実績レコードに対する操作', () => {
    test('挿入した項目を取得できること', async () => {
      const actual = await findIncomeRecord(env.D1)({
        financialMonthId: dummyFinancialMonth1.id,
        definitionId: dummyIncomeDefinition.id,
      })

      expect(actual).toStrictEqual({
        userId: dummyUser.id,
        financialMonthId: dummyFinancialMonth1.id,
        definitionId: dummyIncomeDefinition.id,
        value: 100,
        updatedAt: actual?.updatedAt,
        updatedBy: 'user',
      })
    })

    test('項目を更新できること', async () => {
      const actual = await updateIncomeRecordValue(env.D1)({
        userId: dummyUser.id,
        financialMonthId: dummyFinancialMonth1.id,
        definitionId: dummyIncomeDefinition.id,
        value: 200,
      })

      expect(actual).toStrictEqual({
        userId: dummyUser.id,
        financialMonthId: dummyFinancialMonth1.id,
        definitionId: dummyIncomeDefinition.id,
        updatedAt: actual?.updatedAt,
        value: 200,
        updatedBy: 'user',
      })
    })
  })

  describe('存在しない実績レコードに対する操作', () => {
    let actual: IncomeRecord | undefined

    beforeAll(async () => {
      actual = await updateIncomeRecordValue(env.D1)({
        userId: dummyUser.id,
        financialMonthId: dummyFinancialMonth2.id,
        definitionId: dummyIncomeDefinition.id,
        value: 400,
      })
    })

    test('実績値が更新されていること', () => {
      expect(actual).toStrictEqual({
        userId: dummyUser.id,
        financialMonthId: dummyFinancialMonth2.id,
        definitionId: dummyIncomeDefinition.id,
        updatedAt: actual?.updatedAt,
        value: 400,
        updatedBy: 'user',
      })
    })

    test('操作後、実績レコードは1件増えていること', async () => {
      const stmt = 'SELECT COUNT(*) count FROM income_records'
      const result = await env.D1.prepare(stmt).first<{ count: number }>()
      expect(result?.count).toBe(2)
    })
  })

  describe('既存レコードの削除', () => {
    beforeAll(async () => {
      await resetIncomeRecordValue(env.D1)({
        userId: dummyIncomeRecord.userId,
        financialMonthId: dummyIncomeRecord.financialMonthId,
        definitionId: dummyIncomeRecord.definitionId,
      })
    })

    test('既存のレコードはもう存在しないこと', async () => {
      const removed = await findIncomeRecord(env.D1)({
        financialMonthId: dummyIncomeRecord.financialMonthId,
        definitionId: dummyIncomeRecord.definitionId,
      })

      expect(removed).toBeUndefined()
    })
  })
})

describe('報酬実績の参照', () => {
  const dummyUser = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_user_id',
  })

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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyApril = dummyFinancialYear.months.find(
    ({ info }) => info.month === 4,
  )!

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyJune = dummyFinancialYear.months.find(
    ({ info }) => info.month === 6,
  )!

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyJuly = dummyFinancialYear.months.find(
    ({ info }) => info.month === 7,
  )!

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummySeptember = dummyFinancialYear.months.find(
    ({ info }) => info.month === 9,
  )!

  /** 4~7月までの定義 */
  const dummyIncomeDefinition1 = createIncomeDefinition({
    userId: dummyUser.id,
    kind: 'absolute',
    name: 'テスト定義1',
    value: 100000,
    isTaxable: true,
    from: dummyApril.info,
    to: dummyJuly.info,
  })._unsafeUnwrap()

  /** 6~9月までの定義 */
  const dummyIncomeDefinition2 = createIncomeDefinition({
    userId: dummyUser.id,
    kind: 'related_by_workday',
    name: 'テスト定義2',
    value: 250,
    isTaxable: true,
    from: dummyJune.info,
    to: dummySeptember.info,
  })._unsafeUnwrap()

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)
    await insertStandardIncomeTable(env.D1)(dummyStandardIncomeTable)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
    await insertIncomeDefinition(env.D1)(dummyIncomeDefinition1)
    await insertIncomeDefinition(env.D1)(dummyIncomeDefinition2)
  })

  describe('定義のない状態', () => {
    test.each([
      {
        month: 4,
        expected: [
          {
            userId: dummyUser.id,
            name: 'テスト定義1',
            value: 100000,
          },
        ],
      },
      {
        month: 5,
        expected: [
          {
            userId: dummyUser.id,
            name: 'テスト定義1',
            value: 100000,
          },
        ],
      },
      {
        month: 6,
        expected: [
          {
            userId: dummyUser.id,
            name: 'テスト定義1',
            value: 100000,
          },
          {
            userId: dummyUser.id,
            name: 'テスト定義2',
            value: 5000,
          },
        ],
      },
      {
        month: 7,
        expected: [
          {
            userId: dummyUser.id,
            name: 'テスト定義1',
            value: 100000,
          },
          {
            userId: dummyUser.id,
            name: 'テスト定義2',
            value: 5000,
          },
        ],
      },
      {
        month: 8,
        expected: [
          {
            userId: dummyUser.id,
            name: 'テスト定義2',
            value: 5000,
          },
        ],
      },
      {
        month: 9,
        expected: [
          {
            userId: dummyUser.id,
            name: 'テスト定義2',
            value: 5000,
          },
        ],
      },
    ])('$month月度の報酬実績値', async ({ month, expected }) => {
      const actual = await listIncomeRecordItems(env.D1)({
        userId: dummyUser.id,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        financialMonth: dummyFinancialYear.months.find(
          ({ info }) => info.month === month,
        )!,
      })

      expect(actual).toStrictEqual(expected)
    })
  })

  describe('定義のある状態', () => {
    beforeAll(async () => {
      const dummyRecords = [
        createIncomeRecord({
          userId: dummyUser.id,
          financialMonthId: dummyApril.id,
          definitionId: dummyIncomeDefinition1.id,
          value: 100,
          updatedBy: 'user',
        }),
        createIncomeRecord({
          userId: dummyUser.id,
          financialMonthId: dummyJune.id,
          definitionId: dummyIncomeDefinition1.id,
          value: 200,
          updatedBy: 'user',
        }),
        createIncomeRecord({
          userId: dummyUser.id,
          financialMonthId: dummyJuly.id,
          definitionId: dummyIncomeDefinition2.id,
          value: 300,
          updatedBy: 'user',
        }),
        createIncomeRecord({
          userId: dummyUser.id,
          financialMonthId: dummySeptember.id,
          definitionId: dummyIncomeDefinition2.id,
          value: 400,
          updatedBy: 'user',
        }),
      ]

      await Promise.all(
        dummyRecords.map((entity) => insertIncomeRecord(env.D1)(entity)),
      )
    })

    test.each([
      {
        month: 4,
        expected: [
          {
            userId: dummyUser.id,
            name: 'テスト定義1',
            value: 100,
          },
        ],
      },
      {
        month: 5,
        expected: [
          {
            userId: dummyUser.id,
            name: 'テスト定義1',
            value: 100000,
          },
        ],
      },
      {
        month: 6,
        expected: [
          {
            userId: dummyUser.id,
            name: 'テスト定義1',
            value: 200,
          },
          {
            userId: dummyUser.id,
            name: 'テスト定義2',
            value: 5000,
          },
        ],
      },
      {
        month: 7,
        expected: [
          {
            userId: dummyUser.id,
            name: 'テスト定義1',
            value: 100000,
          },
          {
            userId: dummyUser.id,
            name: 'テスト定義2',
            value: 300,
          },
        ],
      },
      {
        month: 8,
        expected: [
          {
            userId: dummyUser.id,
            name: 'テスト定義2',
            value: 5000,
          },
        ],
      },
      {
        month: 9,
        expected: [
          {
            userId: dummyUser.id,
            name: 'テスト定義2',
            value: 400,
          },
        ],
      },
    ])('$month月度の報酬実績値', async ({ month, expected }) => {
      const actual = await listIncomeRecordItems(env.D1)({
        userId: dummyUser.id,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        financialMonth: dummyFinancialYear.months.find(
          ({ info }) => info.month === month,
        )!,
      })

      expect(actual).toStrictEqual(expected)
    })
  })
})
