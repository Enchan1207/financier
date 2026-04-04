import type { Category, CategoryId } from '@backend/domains/category'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'
import { beforeAll, describe, expect, test } from 'vitest'

import type { CategoryReferences } from '../exceptions'
import {
  CategoryHasReferencesException,
  CategoryNotFoundException,
} from '../exceptions'
import type { DeleteCategoryCommand } from './delete'
import { buildDeleteCategoryWorkflow } from './delete'

const TEST_USER_ID = 'test-user-id-00000000001' as UserId

const noReferences: CategoryReferences = {
  transactions: false,
  budgets: false,
  savingDefinitions: false,
}

describe('buildDeleteCategoryWorkflow', () => {
  describe('正常系 - 参照がないカテゴリを削除できる', () => {
    const category: Category = {
      id: 'test-category-id-0000000001' as CategoryId,
      userId: TEST_USER_ID,
      type: 'expense',
      name: '食費',
      icon: 'utensils',
      color: 'red',
    }

    const command: DeleteCategoryCommand = {
      input: { id: category.id },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildDeleteCategoryWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildDeleteCategoryWorkflow({
        findCategoryById: () => Promise.resolve(category),
        countCategoryReferences: () => Promise.resolve(noReferences),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('categoryIdが返ること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.categoryId).toBe(category.id)
    })
  })

  describe('異常系 - カテゴリが存在しない', () => {
    const command: DeleteCategoryCommand = {
      input: { id: 'non-existent-category-id-000' as CategoryId },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildDeleteCategoryWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildDeleteCategoryWorkflow({
        findCategoryById: () => Promise.resolve(undefined),
        countCategoryReferences: () => Promise.resolve(noReferences),
      })
      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラーがCategoryNotFoundExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error).toBeInstanceOf(CategoryNotFoundException)
    })

    test('エラーメッセージにカテゴリIDが含まれること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error.message).toContain(command.input.id)
    })
  })

  describe('異常系 - トランザクションから参照されている', () => {
    const category: Category = {
      id: 'test-category-id-0000000002' as CategoryId,
      userId: TEST_USER_ID,
      type: 'income',
      name: '給与',
      icon: 'briefcase',
      color: 'green',
    }

    const command: DeleteCategoryCommand = {
      input: { id: category.id },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildDeleteCategoryWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildDeleteCategoryWorkflow({
        findCategoryById: () => Promise.resolve(category),
        countCategoryReferences: () =>
          Promise.resolve({
            transactions: true,
            budgets: false,
            savingDefinitions: false,
          }),
      })
      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラーがCategoryHasReferencesExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error).toBeInstanceOf(CategoryHasReferencesException)
    })

    test('referencesにtransactions=trueが含まれること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      if (!(actual.error instanceof CategoryHasReferencesException))
        throw new Error('Expected CategoryHasReferencesException')
      expect(actual.error.references.transactions).toBe(true)
    })
  })

  describe('異常系 - 複数エンティティから参照されている', () => {
    const category: Category = {
      id: 'test-category-id-0000000003' as CategoryId,
      userId: TEST_USER_ID,
      type: 'expense',
      name: '食費',
      icon: 'utensils',
      color: 'red',
    }

    const command: DeleteCategoryCommand = {
      input: { id: category.id },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildDeleteCategoryWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildDeleteCategoryWorkflow({
        findCategoryById: () => Promise.resolve(category),
        countCategoryReferences: () =>
          Promise.resolve({
            transactions: true,
            budgets: true,
            savingDefinitions: false,
          }),
      })
      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラーメッセージにトランザクションが含まれること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error.message).toContain('トランザクション')
    })

    test('エラーメッセージに予算が含まれること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error.message).toContain('予算')
    })
  })
})
