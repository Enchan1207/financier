import type { Category, CategoryId } from '@backend/domains/category'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'
import { beforeAll, describe, expect, test } from 'vitest'

import {
  CategoryNotFoundException,
  CategoryValidationException,
} from '../exceptions'
import type { UpdateCategoryCommand } from './update'
import { buildUpdateCategoryWorkflow } from './update'

const TEST_USER_ID = 'test-user-id-00000000001' as UserId

describe('buildUpdateCategoryWorkflow', () => {
  describe('正常系 - アクティブなカテゴリを更新できる', () => {
    const activeCategory: Category = {
      id: 'test-category-id-0000000001' as CategoryId,
      userId: TEST_USER_ID,
      type: 'expense',
      name: '食費',
      status: 'active',
      icon: 'utensils',
      color: 'red',
    }

    const command: UpdateCategoryCommand = {
      id: activeCategory.id,
      name: '外食費',
      icon: 'coffee',
      color: 'orange',
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateCategoryWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateCategoryWorkflow({
        findCategoryById: () => Promise.resolve(activeCategory),
      })

      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('nameが更新されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.category.name).toBe('外食費')
    })

    test('iconが更新されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.category.icon).toBe('coffee')
    })

    test('colorが更新されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.category.color).toBe('orange')
    })

    test('idとtypeとstatusが保持されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.category).toStrictEqual({
        id: activeCategory.id,
        userId: TEST_USER_ID,
        type: 'expense',
        name: '外食費',
        status: 'active',
        icon: 'coffee',
        color: 'orange',
      })
    })
  })

  describe('異常系 - カテゴリが存在しない', () => {
    const command: UpdateCategoryCommand = {
      id: 'non-existent-category-id-000' as CategoryId,
      name: '更新後名称',
      icon: 'tag',
      color: 'blue',
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateCategoryWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateCategoryWorkflow({
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

  describe('異常系 - アーカイブ済みカテゴリは更新できない', () => {
    const archivedCategory: Category = {
      id: 'test-category-id-0000000002' as CategoryId,
      userId: TEST_USER_ID,
      type: 'income',
      name: '給与',
      status: 'archived',
      icon: 'briefcase',
      color: 'green',
    }

    const command: UpdateCategoryCommand = {
      id: archivedCategory.id,
      name: '給与収入',
      icon: 'wallet',
      color: 'teal',
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateCategoryWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateCategoryWorkflow({
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
