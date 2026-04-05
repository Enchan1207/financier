import type { Category, CategoryId } from '@backend/domains/category'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'
import { ulid } from 'ulid'
import { assert, describe, expect, test } from 'vitest'

import { EventTemplateValidationException } from '../exceptions'
import { buildCreateEventTemplateWorkflow } from './create'

const userId = `usr-${ulid()}` as UserId

const makeCategory = (type: Category['type']): Category => ({
  id: `cat-${ulid()}` as CategoryId,
  userId,
  type,
  name: 'テストカテゴリ',
  icon: 'tag',
  color: 'red',
})

describe('buildCreateEventTemplateWorkflow', () => {
  describe('正常系 - テンプレートを作成できる', () => {
    const category = makeCategory('expense')
    const workflow = buildCreateEventTemplateWorkflow({
      findCategoryById: () => Promise.resolve(category),
    })

    let result: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      result = await workflow({
        input: {
          name: '旅行テンプレート',
          defaultTransactions: [
            { categoryId: category.id, name: '交通費', amount: 10000 },
          ],
        },
        context: { userId },
      })
    })

    test('成功すること', () => {
      expect(Result.isSuccess(result)).toBe(true)
    })

    test('テンプレート名が正しいこと', () => {
      assert(Result.isSuccess(result))
      expect(result.value.template.name).toBe('旅行テンプレート')
    })

    test('取引定義が正しいこと', () => {
      assert(Result.isSuccess(result))
      expect(result.value.template.defaultTransactions[0]?.name).toBe('交通費')
    })
  })

  describe('異常系 - カテゴリが存在しない場合は失敗する', () => {
    const workflow = buildCreateEventTemplateWorkflow({
      findCategoryById: () => Promise.resolve(undefined),
    })

    let result: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      result = await workflow({
        input: {
          name: 'テンプレート',
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
      expect(Result.isFailure(result) && result.error).toBeInstanceOf(
        EventTemplateValidationException,
      )
    })
  })

  describe('異常系 - 積立カテゴリを指定した場合は失敗する', () => {
    const savingCategory = makeCategory('saving')
    const workflow = buildCreateEventTemplateWorkflow({
      findCategoryById: () => Promise.resolve(savingCategory),
    })

    let result: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      result = await workflow({
        input: {
          name: 'テンプレート',
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
      expect(Result.isFailure(result) && result.error).toBeInstanceOf(
        EventTemplateValidationException,
      )
    })
  })
})
