import type { Category, CategoryId } from '@backend/domains/category'
import { Result } from '@praha/byethrow'
import { beforeAll, describe, expect, test } from 'vitest'

import {
  CategoryNotFoundException,
  CategoryValidationException,
} from '../exceptions'
import type { ArchiveCategoryCommand } from './archive'
import { buildArchiveCategoryWorkflow } from './archive'

describe('buildArchiveCategoryWorkflow', () => {
  describe('正常系 - アクティブなカテゴリをアーカイブできる', () => {
    const activeCategory: Category = {
      id: 'test-category-id-0000000001' as CategoryId,
      type: 'expense',
      name: '食費',
      status: 'active',
      icon: 'utensils',
      color: 'red',
    }

    const command: ArchiveCategoryCommand = {
      id: activeCategory.id,
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildArchiveCategoryWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildArchiveCategoryWorkflow({
        findCategoryById: () => Promise.resolve(activeCategory),
      })

      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('カテゴリのstatusがarchivedになること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.category.status).toBe('archived')
    })

    test('カテゴリIDが保持されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.category.id).toBe(activeCategory.id)
    })

    test('カテゴリのその他プロパティが保持されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.category).toStrictEqual({
        ...activeCategory,
        status: 'archived',
      })
    })
  })

  describe('異常系 - カテゴリが存在しない', () => {
    const command: ArchiveCategoryCommand = {
      id: 'non-existent-category-id-000' as CategoryId,
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildArchiveCategoryWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildArchiveCategoryWorkflow({
        findCategoryById: () => Promise.resolve(undefined),
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
      expect(actual.error.message).toContain(command.id)
    })
  })

  describe('異常系 - すでにアーカイブ済みのカテゴリ', () => {
    const archivedCategory: Category = {
      id: 'test-category-id-0000000002' as CategoryId,
      type: 'income',
      name: '給与',
      status: 'archived',
      icon: 'briefcase',
      color: 'green',
    }

    const command: ArchiveCategoryCommand = {
      id: archivedCategory.id,
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildArchiveCategoryWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildArchiveCategoryWorkflow({
        findCategoryById: () => Promise.resolve(archivedCategory),
      })

      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラーがCategoryValidationExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error).toBeInstanceOf(CategoryValidationException)
    })

    test('エラーメッセージにアーカイブ済みである旨が含まれること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error.message).toContain('アーカイブ済み')
    })
  })
})
