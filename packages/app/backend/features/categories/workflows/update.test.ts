import type { Category, CategoryId } from '@backend/domains/category'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'
import { beforeAll, describe, expect, test } from 'vitest'

import { CategoryNotFoundException } from '../exceptions'
import type { UpdateCategoryCommand } from './update'
import { buildUpdateCategoryWorkflow } from './update'

const TEST_USER_ID = 'test-user-id-00000000001' as UserId

describe('buildUpdateCategoryWorkflow', () => {
  describe('正常系 - カテゴリを更新できる', () => {
    const category: Category = {
      id: 'test-category-id-0000000001' as CategoryId,
      userId: TEST_USER_ID,
      type: 'expense',
      name: '食費',
      icon: 'utensils',
      color: 'red',
    }

    const command: UpdateCategoryCommand = {
      input: {
        id: category.id,
        name: '外食費',
        icon: 'coffee',
        color: 'orange',
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<
      ReturnType<ReturnType<typeof buildUpdateCategoryWorkflow>>
    >

    beforeAll(async () => {
      const workflow = buildUpdateCategoryWorkflow({
        findCategoryById: () => Promise.resolve(category),
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

    test('idとtypeが保持されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.category).toStrictEqual({
        id: category.id,
        userId: TEST_USER_ID,
        type: 'expense',
        name: '外食費',
        icon: 'coffee',
        color: 'orange',
      })
    })
  })

  describe('異常系 - カテゴリが存在しない', () => {
    const command: UpdateCategoryCommand = {
      input: {
        id: 'non-existent-category-id-000' as CategoryId,
        name: '更新後名称',
        icon: 'tag',
        color: 'blue',
      },
      context: { userId: TEST_USER_ID },
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
      expect(actual.error.message).toContain(command.input.id)
    })
  })
})
