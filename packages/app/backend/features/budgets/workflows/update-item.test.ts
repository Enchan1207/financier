import type { Budget } from '@backend/domains/budget'
import type { Category, CategoryId } from '@backend/domains/category'
import type { FiscalYear, FiscalYearId } from '@backend/domains/fiscal-year'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'
import { beforeAll, describe, expect, test } from 'vitest'

import {
  BudgetValidationException,
  FiscalYearClosedException,
} from '../exceptions'
import type { UpdateBudgetItemCommand } from './update-item'
import { buildUpdateBudgetItemWorkflow } from './update-item'

const TEST_USER_ID = 'test-user-id-00000000001' as UserId

const fiscalYear: FiscalYear = {
  id: 'test-fiscal-year-id-000000001' as FiscalYearId,
  userId: TEST_USER_ID,
  year: 2026,
  status: 'active',
}

const incomeCategory: Category = {
  id: 'test-category-income-00000001' as CategoryId,
  userId: TEST_USER_ID,
  type: 'income',
  name: '給与',
  icon: 'briefcase',
  color: 'green',
}

const expenseCategory: Category = {
  id: 'test-category-expense-0000001' as CategoryId,
  userId: TEST_USER_ID,
  type: 'expense',
  name: '食費',
  icon: 'utensils',
  color: 'red',
}

const existingIncomeBudget: Budget = {
  userId: TEST_USER_ID,
  fiscalYearId: fiscalYear.id,
  categoryId: incomeCategory.id,
  budgetAmount: 300000,
}

describe('buildUpdateBudgetItemWorkflow', () => {
  describe('正常系 - 支出予算を収入予算内で更新できる', () => {
    const command: UpdateBudgetItemCommand = {
      input: {
        year: 2026,
        categoryId: expenseCategory.id,
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
        findCategoryById: () => Promise.resolve(expenseCategory),
        findBudgetsByFiscalYearId: () =>
          Promise.resolve([existingIncomeBudget]),
        findCategoriesByIds: () =>
          Promise.resolve(new Map([[incomeCategory.id, incomeCategory]])),
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
      expect(actual.value.budget.categoryId).toBe(expenseCategory.id)
    })
  })

  describe('異常系 - 年度が締め済みの場合はエラーになる', () => {
    const closedFiscalYear: FiscalYear = { ...fiscalYear, status: 'closed' }

    const command: UpdateBudgetItemCommand = {
      input: {
        year: 2026,
        categoryId: expenseCategory.id,
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
        findCategoryById: () => Promise.resolve(undefined),
        findBudgetsByFiscalYearId: () => Promise.resolve([]),
        findCategoriesByIds: () => Promise.resolve(new Map()),
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

  describe('異常系 - 存在しないカテゴリが指定された場合はエラーになる', () => {
    const command: UpdateBudgetItemCommand = {
      input: {
        year: 2026,
        categoryId: 'non-existent-category-id-000' as CategoryId,
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
        findCategoryById: () => Promise.resolve(undefined),
        findBudgetsByFiscalYearId: () => Promise.resolve([]),
        findCategoriesByIds: () => Promise.resolve(new Map()),
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

  describe('異常系 - 更新後に支出予算が収入予算を超える場合はエラーになる', () => {
    const command: UpdateBudgetItemCommand = {
      input: {
        year: 2026,
        categoryId: expenseCategory.id,
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
        findCategoryById: () => Promise.resolve(expenseCategory),
        findBudgetsByFiscalYearId: () =>
          Promise.resolve([existingIncomeBudget]),
        findCategoriesByIds: () =>
          Promise.resolve(new Map([[incomeCategory.id, incomeCategory]])),
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
