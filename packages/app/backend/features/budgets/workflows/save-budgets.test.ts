import type { Category, CategoryId } from '@backend/domains/category'
import type { FiscalYear, FiscalYearId } from '@backend/domains/fiscal-year'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'
import { beforeAll, describe, expect, test } from 'vitest'

import {
  BudgetValidationException,
  FiscalYearClosedException,
} from '../exceptions'
import type { SaveBudgetsCommand } from './save-budgets'
import { buildSaveBudgetsWorkflow } from './save-budgets'

const TEST_USER_ID = 'test-user-id-00000000001' as UserId

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

const existingFiscalYear: FiscalYear = {
  id: 'test-fiscal-year-id-000000001' as FiscalYearId,
  userId: TEST_USER_ID,
  year: 2026,
  status: 'active',
}

describe('buildSaveBudgetsWorkflow', () => {
  describe('正常系 - 新規年度でバジェットを作成できる', () => {
    const command: SaveBudgetsCommand = {
      input: {
        year: 2025,
        items: [
          { categoryId: incomeCategory.id, budgetAmount: 300000 },
          { categoryId: expenseCategory.id, budgetAmount: 200000 },
        ],
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<ReturnType<ReturnType<typeof buildSaveBudgetsWorkflow>>>

    beforeAll(async () => {
      const workflow = buildSaveBudgetsWorkflow({
        findFiscalYearByYear: () => Promise.resolve(undefined),
        findCategoriesByIds: () =>
          Promise.resolve(
            new Map<CategoryId, Category>([
              [incomeCategory.id, incomeCategory],
              [expenseCategory.id, expenseCategory],
            ]),
          ),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('新規年度フラグがtrueであること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.isNewFiscalYear).toBe(true)
    })

    test('年度が正しいこと', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.fiscalYear.year).toBe(2025)
    })

    test('予算が2件作成されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.budgets).toHaveLength(2)
    })

    test('予算金額が正しいこと', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      const incomeBudget = actual.value.budgets.find(
        (b) => b.categoryId === incomeCategory.id,
      )
      expect(incomeBudget?.budgetAmount).toBe(300000)
    })
  })

  describe('正常系 - 既存年度でバジェットを更新できる', () => {
    const command: SaveBudgetsCommand = {
      input: {
        year: 2026,
        items: [
          { categoryId: incomeCategory.id, budgetAmount: 400000 },
          { categoryId: expenseCategory.id, budgetAmount: 300000 },
        ],
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<ReturnType<ReturnType<typeof buildSaveBudgetsWorkflow>>>

    beforeAll(async () => {
      const workflow = buildSaveBudgetsWorkflow({
        findFiscalYearByYear: () => Promise.resolve(existingFiscalYear),
        findCategoriesByIds: () =>
          Promise.resolve(
            new Map<CategoryId, Category>([
              [incomeCategory.id, incomeCategory],
              [expenseCategory.id, expenseCategory],
            ]),
          ),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('新規年度フラグがfalseであること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.isNewFiscalYear).toBe(false)
    })

    test('既存の年度IDが使われること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.fiscalYear.id).toBe(existingFiscalYear.id)
    })
  })

  describe('異常系 - 年度が締め済みの場合はエラーになる', () => {
    const closedFiscalYear: FiscalYear = {
      ...existingFiscalYear,
      status: 'closed',
    }

    const command: SaveBudgetsCommand = {
      input: {
        year: 2026,
        items: [{ categoryId: incomeCategory.id, budgetAmount: 300000 }],
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<ReturnType<ReturnType<typeof buildSaveBudgetsWorkflow>>>

    beforeAll(async () => {
      const workflow = buildSaveBudgetsWorkflow({
        findFiscalYearByYear: () => Promise.resolve(closedFiscalYear),
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
    const command: SaveBudgetsCommand = {
      input: {
        year: 2026,
        items: [
          {
            categoryId: 'non-existent-category-id-000' as CategoryId,
            budgetAmount: 300000,
          },
        ],
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<ReturnType<ReturnType<typeof buildSaveBudgetsWorkflow>>>

    beforeAll(async () => {
      const workflow = buildSaveBudgetsWorkflow({
        findFiscalYearByYear: () => Promise.resolve(existingFiscalYear),
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

  describe('異常系 - 支出予算が収入予算を超える場合はエラーになる', () => {
    const command: SaveBudgetsCommand = {
      input: {
        year: 2026,
        items: [
          { categoryId: incomeCategory.id, budgetAmount: 200000 },
          { categoryId: expenseCategory.id, budgetAmount: 300000 },
        ],
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<ReturnType<ReturnType<typeof buildSaveBudgetsWorkflow>>>

    beforeAll(async () => {
      const workflow = buildSaveBudgetsWorkflow({
        findFiscalYearByYear: () => Promise.resolve(existingFiscalYear),
        findCategoriesByIds: () =>
          Promise.resolve(
            new Map<CategoryId, Category>([
              [incomeCategory.id, incomeCategory],
              [expenseCategory.id, expenseCategory],
            ]),
          ),
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

    test('エラーメッセージに金額情報が含まれること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error.message).toContain('300000')
    })
  })
})
