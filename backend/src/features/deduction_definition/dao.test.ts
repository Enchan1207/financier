import { env } from 'cloudflare:test'

import type { DeductionDefinition } from '@/domains/deduction_definition'
import {
  createDeductionDefinition,
  createDeductionRecord,
} from '@/domains/deduction_definition/logic'
import {
  createFinancialMonthInfo,
  getPeriodByFinancialMonth,
} from '@/domains/financial_month_context/logic'
import { createFinancialYear } from '@/domains/financial_year/logic'
import { createStandardIncomeTable } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import { createUser } from '@/domains/user/logic'
import dayjs from '@/logic/dayjs'

import { saveUser } from '../authorize/dao'
import {
  findDeductionRecord,
  insertDeductionRecord,
} from '../deduction_record/dao'
import { insertFinancialYear } from '../financial_year/dao'
import { insertStandardIncomeTable } from '../standard_income/dao'
import {
  findDeductionDefinitions,
  getDeductionDefinitionById,
  insertDeductionDefinition,
  updateDeductionDefinition,
} from './dao'

/** エンティティを相互変換可能な型に変換する */
const makeComparable = (entity?: DeductionDefinition) => {
  return {
    ...entity,
    enabledAt: entity?.enabledAt.valueOf(),
    disabledAt: entity?.disabledAt.valueOf(),
    updatedAt: entity?.updatedAt.valueOf(),
  }
}

const dummyUser: User = createUser({
  name: 'testuser',
  email: 'test@example.com',
  auth0UserId: 'auth0_test_user',
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

describe('基本的なCRUD', () => {
  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    financialYear: 2025,
    standardIncomeTableId: dummyStandardIncomeTable.id,
  })._unsafeUnwrap()

  const dummyDefinition = createDeductionDefinition({
    userId: dummyUser.id,
    name: '基本給',
    kind: 'absolute',
    value: 230000,
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
    await insertStandardIncomeTable(env.D1)(dummyStandardIncomeTable)
    await insertFinancialYear(env.D1)(dummyFinancialYear)
    await insertDeductionDefinition(env.D1)(dummyDefinition)
  })

  test('報酬実績が登録されていないこと', async () => {
    const stmt = 'SELECT COUNT(*) count FROM deduction_definitions'
    const result = await env.D1.prepare(stmt).first<{ count: number }>()
    expect(result?.count).toBe(0)
  })

  describe('id直打ちで取得', () => {
    let actual: DeductionDefinition | undefined

    beforeAll(async () => {
      actual = await getDeductionDefinitionById(env.D1)(
        dummyUser.id,
        dummyDefinition.id,
      )
    })

    test('同じ項目を取得できること', () => {
      expect(makeComparable(actual)).toStrictEqual(
        makeComparable(dummyDefinition),
      )
    })
  })

  describe('項目の更新', () => {
    let actual: DeductionDefinition | undefined

    beforeAll(async () => {
      actual = await updateDeductionDefinition(env.D1)(
        dummyUser.id,
        dummyDefinition.id,
        {
          current: dummyDefinition,
          update: {
            kind: 'related_by_workday',
            name: '通勤手当',
            value: 300,
            from: createFinancialMonthInfo({
              financialYear: 2025,
              month: 6,
            })._unsafeUnwrap(),
            to: createFinancialMonthInfo({
              financialYear: 2025,
              month: 1,
            })._unsafeUnwrap(),
          },
        },
      )
    })

    test('値が更新されていること', () => {
      const { start } = getPeriodByFinancialMonth(
        createFinancialMonthInfo({
          financialYear: 2025,
          month: 6,
        })._unsafeUnwrap(),
      )

      const { end } = getPeriodByFinancialMonth(
        createFinancialMonthInfo({
          financialYear: 2025,
          month: 1,
        })._unsafeUnwrap(),
      )

      expect(makeComparable(actual)).toStrictEqual({
        id: dummyDefinition.id,
        userId: dummyDefinition.userId,
        kind: 'related_by_workday',
        name: '通勤手当',
        value: 300,
        enabledAt: start.valueOf(),
        disabledAt: end.valueOf(),
        updatedAt: actual?.updatedAt.valueOf(),
      })
    })
  })
})

describe('詳細な検索', () => {
  const dummyUser: User = createUser({
    name: 'testuser',
    email: 'test@example.com',
    auth0UserId: 'auth0_test_user',
  })

  const dummyDefinition1 = createDeductionDefinition({
    userId: dummyUser.id,
    name: '手当1',
    kind: 'related_by_workday',
    value: 380,
    from: createFinancialMonthInfo({
      financialYear: 2025,
      month: 4,
    })._unsafeUnwrap(),
    to: createFinancialMonthInfo({
      financialYear: 2025,
      month: 12,
    })._unsafeUnwrap(),
  })._unsafeUnwrap()

  const dummyDefinition2 = createDeductionDefinition({
    userId: dummyUser.id,
    name: '手当2',
    kind: 'related_by_workday',
    value: 380,
    from: createFinancialMonthInfo({
      financialYear: 2025,
      month: 8,
    })._unsafeUnwrap(),
    to: createFinancialMonthInfo({
      financialYear: 2025,
      month: 2,
    })._unsafeUnwrap(),
  })._unsafeUnwrap()

  beforeAll(async () => {
    await saveUser(env.D1)(dummyUser)

    await insertDeductionDefinition(env.D1)(dummyDefinition1)
    await insertDeductionDefinition(env.D1)(dummyDefinition2)
  })

  test.each([
    {
      month: 4,
      expected: [dummyDefinition1],
    },
    {
      month: 8,
      expected: [dummyDefinition1, dummyDefinition2],
    },
    {
      month: 1,
      expected: [dummyDefinition2],
    },
  ])('単月検索 $month月度', async ({ month, expected }) => {
    const financialMonth = createFinancialMonthInfo({
      financialYear: 2025,
      month,
    })._unsafeUnwrap()
    const { start, end } = getPeriodByFinancialMonth(financialMonth)

    const actual = await findDeductionDefinitions(env.D1)({
      userId: dummyUser.id,
      sortBy: 'enabledAt',
      order: 'asc',
      limit: 100,
      period: {
        start,
        end,
      },
    })

    expect(actual.map(makeComparable)).toStrictEqual(
      expected.map(makeComparable),
    )
  })

  test('年度全体での検索', async () => {
    const actual = await findDeductionDefinitions(env.D1)({
      userId: dummyUser.id,
      sortBy: 'enabledAt',
      order: 'asc',
      limit: 100,
      period: {
        start: dayjs.tz('2025-04-01T00:00:00.000', 'Asia/Tokyo'),
        end: dayjs.tz('2026-03-31T23:59:59.999', 'Asia/Tokyo'),
      },
    })

    expect(actual.map(makeComparable)).toStrictEqual(
      [dummyDefinition1, dummyDefinition2].map(makeComparable),
    )
  })
})

describe('定義期間の更新', () => {
  const dummyFinancialYear = createFinancialYear({
    userId: dummyUser.id,
    financialYear: 2025,
    standardIncomeTableId: dummyStandardIncomeTable.id,
  })._unsafeUnwrap()

  const dummyDefinition = createDeductionDefinition({
    userId: dummyUser.id,
    name: '基本給',
    kind: 'absolute',
    value: 230000,
    from: createFinancialMonthInfo({
      financialYear: 2025,
      month: 4,
    })._unsafeUnwrap(),
    to: createFinancialMonthInfo({
      financialYear: 2025,
      month: 3,
    })._unsafeUnwrap(),
  })._unsafeUnwrap()

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyApril = dummyFinancialYear.months.find(
    ({ info: { month } }) => month === 4,
  )!

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummySeptember = dummyFinancialYear.months.find(
    ({ info: { month } }) => month === 9,
  )!

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const dummyFebruary = dummyFinancialYear.months.find(
    ({ info: { month } }) => month === 2,
  )!

  // 4月度の実績
  const dummyRecord1 = createDeductionRecord({
    userId: dummyUser.id,
    definitionId: dummyDefinition.id,
    financialMonthId: dummyApril.id,
    updatedBy: 'user',
    value: 12345,
  })

  // 9月度の実績
  const dummyRecord2 = createDeductionRecord({
    userId: dummyUser.id,
    definitionId: dummyDefinition.id,
    financialMonthId: dummySeptember.id,
    updatedBy: 'user',
    value: 12345,
  })

  // 2月度の実績
  const dummyRecord3 = createDeductionRecord({
    userId: dummyUser.id,
    definitionId: dummyDefinition.id,
    financialMonthId: dummyFebruary.id,
    updatedBy: 'user',
    value: 12345,
  })

  beforeAll(async () => {
    await Promise.all([
      saveUser(env.D1)(dummyUser),

      insertStandardIncomeTable(env.D1)(dummyStandardIncomeTable),
      insertFinancialYear(env.D1)(dummyFinancialYear),
      insertDeductionDefinition(env.D1)(dummyDefinition),

      insertDeductionRecord(env.D1)(dummyRecord1),
      insertDeductionRecord(env.D1)(dummyRecord2),
      insertDeductionRecord(env.D1)(dummyRecord3),
    ])
  })

  describe('定義の開始月を5月にした場合', () => {
    beforeAll(async () => {
      await updateDeductionDefinition(env.D1)(
        dummyUser.id,
        dummyDefinition.id,
        {
          current: dummyDefinition,
          update: {
            kind: undefined,
            name: undefined,
            value: undefined,
            from: createFinancialMonthInfo({
              financialYear: dummyFinancialYear.year,
              month: 5,
            })._unsafeUnwrap(),
            to: undefined,
          },
        },
      )
    })

    test('実績1は削除されていること', async () => {
      const record = await findDeductionRecord(env.D1)({
        financialMonthId: dummyApril.id,
        definitionId: dummyDefinition.id,
      })

      expect(record).toBeUndefined()
    })

    test('実績2は削除されていないこと', async () => {
      const record = await findDeductionRecord(env.D1)({
        financialMonthId: dummySeptember.id,
        definitionId: dummyDefinition.id,
      })
      expect(record).toBeDefined()
    })

    test('実績3は削除されていないこと', async () => {
      const record = await findDeductionRecord(env.D1)({
        financialMonthId: dummyFebruary.id,
        definitionId: dummyDefinition.id,
      })
      expect(record).toBeDefined()
    })
  })

  describe('定義の終了月を1月にした場合', () => {
    beforeAll(async () => {
      await updateDeductionDefinition(env.D1)(
        dummyUser.id,
        dummyDefinition.id,
        {
          current: dummyDefinition,
          update: {
            kind: undefined,
            name: undefined,
            value: undefined,
            from: undefined,
            to: createFinancialMonthInfo({
              financialYear: dummyFinancialYear.year,
              month: 1,
            })._unsafeUnwrap(),
          },
        },
      )
    })

    test('実績1は削除されていないこと', async () => {
      const record = await findDeductionRecord(env.D1)({
        financialMonthId: dummyApril.id,
        definitionId: dummyDefinition.id,
      })

      expect(record).toBeDefined()
    })

    test('実績2は削除されていないこと', async () => {
      const record = await findDeductionRecord(env.D1)({
        financialMonthId: dummySeptember.id,
        definitionId: dummyDefinition.id,
      })
      expect(record).toBeDefined()
    })

    test('実績3は削除されていること', async () => {
      const record = await findDeductionRecord(env.D1)({
        financialMonthId: dummyFebruary.id,
        definitionId: dummyDefinition.id,
      })
      expect(record).toBeUndefined()
    })
  })
})
