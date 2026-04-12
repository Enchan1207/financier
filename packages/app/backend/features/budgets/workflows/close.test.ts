import type { FiscalYear, FiscalYearId } from '@backend/domains/fiscal-year'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'
import { beforeAll, describe, expect, test } from 'vitest'

import { FiscalYearNotFoundException } from '../exceptions'
import type { CloseFiscalYearCommand } from './close'
import { buildCloseFiscalYearWorkflow } from './close'

const TEST_USER_ID = 'test-user-id-00000000001' as UserId

const activeFiscalYear: FiscalYear = {
  id: 'test-fiscal-year-id-000000001' as FiscalYearId,
  userId: TEST_USER_ID,
  year: 2026,
  status: 'active',
}

describe('buildCloseFiscalYearWorkflow', () => {
  describe('正常系 - アクティブな年度を締めることができる', () => {
    const command: CloseFiscalYearCommand = {
      input: { year: 2026 },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildCloseFiscalYearWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildCloseFiscalYearWorkflow({
        findFiscalYearByYear: () => Promise.resolve(activeFiscalYear),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('年度のstatusがclosedになること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.fiscalYear.status).toBe('closed')
    })

    test('年度のIDが変わらないこと', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.fiscalYear.id).toBe(activeFiscalYear.id)
    })

    test('年度の年が変わらないこと', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.fiscalYear.year).toBe(2026)
    })
  })

  describe('正常系 - 締め済みの年度を再度締めることができる', () => {
    const closedFiscalYear: FiscalYear = {
      ...activeFiscalYear,
      status: 'closed',
    }

    const command: CloseFiscalYearCommand = {
      input: { year: 2026 },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildCloseFiscalYearWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildCloseFiscalYearWorkflow({
        findFiscalYearByYear: () => Promise.resolve(closedFiscalYear),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('年度のstatusがclosedのままであること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.fiscalYear.status).toBe('closed')
    })
  })

  describe('異常系 - 年度が存在しない場合はエラーになる', () => {
    const command: CloseFiscalYearCommand = {
      input: { year: 2099 },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildCloseFiscalYearWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildCloseFiscalYearWorkflow({
        findFiscalYearByYear: () => Promise.resolve(undefined),
      })
      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラーがFiscalYearNotFoundExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error).toBeInstanceOf(FiscalYearNotFoundException)
    })

    test('エラーメッセージに年度が含まれること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error.message).toContain('2099')
    })
  })
})
