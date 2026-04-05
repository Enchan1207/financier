import type { Category, CategoryId } from '@backend/domains/category'
import type {
  EventTemplate,
  EventTemplateId,
} from '@backend/domains/event-template'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'
import { ulid } from 'ulid'
import { assert, describe, expect, test } from 'vitest'

import {
  EventTemplateNotFoundException,
  EventTemplateValidationException,
} from '../exceptions'
import { buildUpdateEventTemplateWorkflow } from './update'

const userId = `usr-${ulid()}` as UserId

const makeCategory = (type: Category['type']): Category => ({
  id: `cat-${ulid()}` as CategoryId,
  userId,
  type,
  name: 'テストカテゴリ',
  icon: 'tag',
  color: 'red',
})

const makeTemplate = (
  overrides: Partial<EventTemplate> = {},
): EventTemplate => ({
  id: `tpl-${ulid()}` as EventTemplateId,
  userId,
  name: '旅行テンプレート',
  defaultTransactions: [],
  ...overrides,
})

describe('buildUpdateEventTemplateWorkflow', () => {
  describe('正常系 - テンプレート名を更新できる', () => {
    const category = makeCategory('expense')
    const template = makeTemplate({
      defaultTransactions: [
        { categoryId: category.id, name: '交通費', amount: 10000 },
      ],
    })
    const workflow = buildUpdateEventTemplateWorkflow({
      findEventTemplateById: () => Promise.resolve(template),
      findCategoryById: () => Promise.resolve(category),
    })

    let result: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      result = await workflow({
        input: { id: template.id, name: '更新後テンプレート' },
        context: { userId },
      })
    })

    test('成功すること', () => {
      expect(Result.isSuccess(result)).toBe(true)
    })

    test('テンプレート名が更新されること', () => {
      assert(Result.isSuccess(result))
      expect(result.value.template.name).toBe('更新後テンプレート')
    })

    test('取引定義が変わらないこと', () => {
      assert(Result.isSuccess(result))
      expect(result.value.template.defaultTransactions).toHaveLength(1)
    })
  })

  describe('正常系 - 取引定義を更新できる', () => {
    const category = makeCategory('expense')
    const newCategory = makeCategory('income')
    const template = makeTemplate({
      defaultTransactions: [
        { categoryId: category.id, name: '交通費', amount: 10000 },
      ],
    })
    const workflow = buildUpdateEventTemplateWorkflow({
      findEventTemplateById: () => Promise.resolve(template),
      findCategoryById: () => Promise.resolve(newCategory),
    })

    let result: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      result = await workflow({
        input: {
          id: template.id,
          defaultTransactions: [
            { categoryId: newCategory.id, name: '給与', amount: 300000 },
          ],
        },
        context: { userId },
      })
    })

    test('成功すること', () => {
      expect(Result.isSuccess(result)).toBe(true)
    })

    test('取引定義が更新されること', () => {
      assert(Result.isSuccess(result))
      expect(result.value.template.defaultTransactions[0]?.name).toBe('給与')
    })

    test('テンプレート名が変わらないこと', () => {
      assert(Result.isSuccess(result))
      expect(result.value.template.name).toBe(template.name)
    })
  })

  describe('異常系 - テンプレートが存在しない場合は失敗する', () => {
    const workflow = buildUpdateEventTemplateWorkflow({
      findEventTemplateById: () => Promise.resolve(undefined),
      findCategoryById: () => Promise.resolve(undefined),
    })

    let result: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      result = await workflow({
        input: { id: 'non-existent' as EventTemplateId, name: '更新' },
        context: { userId },
      })
    })

    test('失敗すること', () => {
      expect(Result.isFailure(result)).toBe(true)
    })

    test('EventTemplateNotFoundException であること', () => {
      assert(Result.isFailure(result))
      expect(result.error).toBeInstanceOf(EventTemplateNotFoundException)
    })
  })

  describe('異常系 - カテゴリが存在しない場合は失敗する', () => {
    const template = makeTemplate({
      defaultTransactions: [
        { categoryId: 'cat-1' as CategoryId, name: '費用', amount: 1000 },
      ],
    })
    const workflow = buildUpdateEventTemplateWorkflow({
      findEventTemplateById: () => Promise.resolve(template),
      findCategoryById: () => Promise.resolve(undefined),
    })

    let result: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      result = await workflow({
        input: {
          id: template.id,
          defaultTransactions: [
            {
              categoryId: 'non-existent' as CategoryId,
              name: '費用',
              amount: 1000,
            },
          ],
        },
        context: { userId },
      })
    })

    test('失敗すること', () => {
      expect(Result.isFailure(result)).toBe(true)
    })

    test('EventTemplateValidationException であること', () => {
      assert(Result.isFailure(result))
      expect(result.error).toBeInstanceOf(EventTemplateValidationException)
    })
  })

  describe('異常系 - 積立カテゴリを指定した場合は失敗する', () => {
    const savingCategory = makeCategory('saving')
    const template = makeTemplate()
    const workflow = buildUpdateEventTemplateWorkflow({
      findEventTemplateById: () => Promise.resolve(template),
      findCategoryById: () => Promise.resolve(savingCategory),
    })

    let result: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      result = await workflow({
        input: {
          id: template.id,
          defaultTransactions: [
            { categoryId: savingCategory.id, name: '積立', amount: 5000 },
          ],
        },
        context: { userId },
      })
    })

    test('失敗すること', () => {
      expect(Result.isFailure(result)).toBe(true)
    })

    test('EventTemplateValidationException であること', () => {
      assert(Result.isFailure(result))
      expect(result.error).toBeInstanceOf(EventTemplateValidationException)
    })
  })
})
