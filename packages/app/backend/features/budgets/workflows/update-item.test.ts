import type { FiscalYear, FiscalYearId } from '@backend/domains/fiscal-year'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'
import { beforeAll, describe, expect, test } from 'vitest'

import {
  BudgetNotFoundException,
  BudgetValidationException,
  FiscalYearClosedException,
} from '../exceptions'
import type { BudgetWithCategoryType } from '../repository'
import type { UpdateBudgetItemCommand } from './update-item'
import { buildUpdateBudgetItemWorkflow } from './update-item'

const TEST_USER_ID = 'test-user-id-00000000001' as UserId

const INCOME_CATEGORY_ID = 'test-category-income-00000001'
const EXPENSE_CATEGORY_ID = 'test-category-expense-0000001'

const fiscalYear: FiscalYear = {
  id: 'test-fiscal-year-id-000000001' as FiscalYearId,
  userId: TEST_USER_ID,
  year: 2026,
  status: 'active',
}

const existingBudgets: BudgetWithCategoryType[] = [
  {
    userId: TEST_USER_ID,
    fiscalYearId: fiscalYear.id,
    categoryId: INCOME_CATEGORY_ID as BudgetWithCategoryType['categoryId'],
    budgetAmount: 300000,
    categoryType: 'income',
  },
  {
    userId: TEST_USER_ID,
    fiscalYearId: fiscalYear.id,
    categoryId: EXPENSE_CATEGORY_ID as BudgetWithCategoryType['categoryId'],
    budgetAmount: 100000,
    categoryType: 'expense',
  },
]

describe('buildUpdateBudgetItemWorkflow', () => {
  describe('正常系 - 支出予算を収入予算内で更新できる', () => {
    const command: UpdateBudgetItemCommand = {
      input: {
        year: 2026,
        categoryId: EXPENSE_CATEGORY_ID,
        budgetAmount: 200000,
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateBudgetItemWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateBudgetItemWorkflow({
        findFiscalYearByYear: () => Promise.resolve(fiscalYear),
        findBudgetsWithCategoryTypeByFiscalYearId: () =>
          Promise.resolve(existingBudgets),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('予算金額が正しいこと', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.budget.budgetAmount).toBe(200000)
    })

    test('カテゴリIDが正しいこと', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.budget.categoryId).toBe(EXPENSE_CATEGORY_ID)
    })
  })

  describe('異常系 - 年度が締め済みの場合はエラーになる', () => {
    const closedFiscalYear: FiscalYear = { ...fiscalYear, status: 'closed' }

    const command: UpdateBudgetItemCommand = {
      input: {
        year: 2026,
        categoryId: EXPENSE_CATEGORY_ID,
        budgetAmount: 100000,
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateBudgetItemWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateBudgetItemWorkflow({
        findFiscalYearByYear: () => Promise.resolve(closedFiscalYear),
        findBudgetsWithCategoryTypeByFiscalYearId: () => Promise.resolve([]),
      })
      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラーがFiscalYearClosedExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error).toBeInstanceOf(FiscalYearClosedException)
    })
  })

  describe('異常系 - 予算アイテムが存在しない場合はエラーになる', () => {
    const command: UpdateBudgetItemCommand = {
      input: {
        year: 2026,
        categoryId: 'non-existent-category-id-000',
        budgetAmount: 100000,
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateBudgetItemWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateBudgetItemWorkflow({
        findFiscalYearByYear: () => Promise.resolve(fiscalYear),
        findBudgetsWithCategoryTypeByFiscalYearId: () =>
          Promise.resolve(existingBudgets),
      })
      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラーがBudgetNotFoundExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error).toBeInstanceOf(BudgetNotFoundException)
    })
  })

  describe('異常系 - 更新後に支出予算が収入予算を超える場合はエラーになる', () => {
    const command: UpdateBudgetItemCommand = {
      input: {
        year: 2026,
        categoryId: EXPENSE_CATEGORY_ID,
        budgetAmount: 400000,
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateBudgetItemWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateBudgetItemWorkflow({
        findFiscalYearByYear: () => Promise.resolve(fiscalYear),
        findBudgetsWithCategoryTypeByFiscalYearId: () =>
          Promise.resolve(existingBudgets),
      })
      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラーがBudgetValidationExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error).toBeInstanceOf(BudgetValidationException)
    })
  })
})
