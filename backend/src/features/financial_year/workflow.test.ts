import type { ResultAsync } from 'neverthrow'
import { Err, Ok } from 'neverthrow'

import type { FinancialYearValue } from '@/domains/financial_year'
import { createUser } from '@/domains/user/logic'
import type { ValidationError } from '@/logic/errors'

import type { FinancialYearPostEvent } from './workflow'
import { createFinancialYearPostWorkflow } from './workflow'

describe('正常系', () => {
  beforeAll(() => {
    vi.setSystemTime('2024-08-08T09:00:00Z')
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('現在時刻に基づく最初の会計年度を生成する場合', () => {
    const workflow = createFinancialYearPostWorkflow({
      listFinancialYears: async () => Promise.resolve([]),
    })

    let actual: Awaited<ResultAsync<FinancialYearPostEvent, ValidationError>>

    beforeAll(async () => {
      actual = await workflow({
        input: {
          year: 2024,
          standardIncomeTableId: '',
        },
        state: {
          user: createUser({
            name: '',
            email: '',
            auth0UserId: '',
          }),
        },
      })
    })

    test('正常に作成できること', () => {
      expect(actual).toBeInstanceOf(Ok)
    })
  })

  describe('連続した二つ目の会計年度を生成する場合', () => {
    const workflow = createFinancialYearPostWorkflow({
      listFinancialYears: async () =>
        Promise.resolve([2024] as FinancialYearValue[]),
    })

    let actual: Awaited<ResultAsync<FinancialYearPostEvent, ValidationError>>

    beforeAll(async () => {
      actual = await workflow({
        input: {
          year: 2025,
          standardIncomeTableId: '',
        },
        state: {
          user: createUser({
            name: '',
            email: '',
            auth0UserId: '',
          }),
        },
      })
    })

    test('正常に作成できること', () => {
      expect(actual).toBeInstanceOf(Ok)
    })
  })
})

describe('異常系', () => {
  beforeAll(() => {
    vi.setSystemTime('2024-08-08T09:00:00Z')
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('コマンドバリデーションエラー', () => {
    const workflow = createFinancialYearPostWorkflow({
      listFinancialYears: async () => Promise.resolve([]),
    })

    let actual: Awaited<ResultAsync<FinancialYearPostEvent, ValidationError>>

    beforeAll(async () => {
      actual = await workflow({
        input: {
          year: -1,
          standardIncomeTableId: '',
        },
        state: {
          user: createUser({
            name: '',
            email: '',
            auth0UserId: '',
          }),
        },
      })
    })

    test('正常に作成できないこと', () => {
      expect(actual).toBeInstanceOf(Err)
    })
  })

  describe('現在時刻から離れた最初の会計年度を生成する場合', () => {
    const workflow = createFinancialYearPostWorkflow({
      listFinancialYears: async () => Promise.resolve([]),
    })

    let actual: Awaited<ResultAsync<FinancialYearPostEvent, ValidationError>>

    beforeAll(async () => {
      actual = await workflow({
        input: {
          year: 2023,
          standardIncomeTableId: '',
        },
        state: {
          user: createUser({
            name: '',
            email: '',
            auth0UserId: '',
          }),
        },
      })
    })

    test('正常に作成できないこと', () => {
      expect(actual).toBeInstanceOf(Err)
    })
  })

  describe('連続しない二つ目の会計年度を生成する場合', () => {
    const workflow = createFinancialYearPostWorkflow({
      listFinancialYears: async () =>
        Promise.resolve([2024] as FinancialYearValue[]),
    })

    let actual: Awaited<ResultAsync<FinancialYearPostEvent, ValidationError>>

    beforeAll(async () => {
      actual = await workflow({
        input: {
          year: 2026,
          standardIncomeTableId: '',
        },
        state: {
          user: createUser({
            name: '',
            email: '',
            auth0UserId: '',
          }),
        },
      })
    })

    test('正常に作成できないこと', () => {
      expect(actual).toBeInstanceOf(Err)
    })
  })
})
