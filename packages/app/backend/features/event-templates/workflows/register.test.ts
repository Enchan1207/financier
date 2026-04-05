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
import { buildRegisterEventTemplateWorkflow } from './register'

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

describe('buildRegisterEventTemplateWorkflow', () => {
  describe('正常系 - イベントとトランザクションを生成できる', () => {
    const category = makeCategory('expense')
    const template = makeTemplate()
    const workflow = buildRegisterEventTemplateWorkflow({
      findEventTemplateById: () => Promise.resolve(template),
      findCategoriesByIds: (ids) =>
        Promise.resolve(new Map(ids.map((id) => [id, category]))),
    })

    let result: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      result = await workflow({
        input: {
          id: template.id,
          occurredOn: '2026-04-01',
          items: [
            { categoryId: category.id, name: '交通費', amount: 10000 },
            { categoryId: category.id, name: '宿泊費', amount: 20000 },
          ],
        },
        context: { userId },
      })
    })

    test('成功すること', () => {
      expect(Result.isSuccess(result)).toBe(true)
    })

    test('イベント名がテンプレート名と一致すること', () => {
      assert(Result.isSuccess(result))
      expect(result.value.event.name).toBe(template.name)
    })

    test('トランザクション数が正しいこと', () => {
      assert(Result.isSuccess(result))
      expect(result.value.transactions.length).toBe(2)
    })

    test('トランザクション種別がカテゴリから決定されること', () => {
      assert(Result.isSuccess(result))
      expect(result.value.transactions[0]?.type).toBe('expense')
    })
  })

  describe('正常系 - 収入カテゴリはincomeとなること', () => {
    const incomeCategory = makeCategory('income')
    const template = makeTemplate()
    const workflow = buildRegisterEventTemplateWorkflow({
      findEventTemplateById: () => Promise.resolve(template),
      findCategoriesByIds: (ids) =>
        Promise.resolve(new Map(ids.map((id) => [id, incomeCategory]))),
    })

    let result: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      result = await workflow({
        input: {
          id: template.id,
          occurredOn: '2026-04-01',
          items: [
            { categoryId: incomeCategory.id, name: '給与', amount: 300000 },
          ],
        },
        context: { userId },
      })
    })

    test('トランザクション種別がincomeであること', () => {
      assert(Result.isSuccess(result))
      expect(result.value.transactions[0]?.type).toBe('income')
    })
  })

  describe('異常系 - テンプレートが存在しない場合は失敗する', () => {
    const workflow = buildRegisterEventTemplateWorkflow({
      findEventTemplateById: () => Promise.resolve(undefined),
      findCategoriesByIds: () => Promise.resolve(new Map()),
    })

    let result: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      result = await workflow({
        input: {
          id: 'non-existent' as EventTemplateId,
          occurredOn: '2026-04-01',
          items: [
            { categoryId: 'cat-1' as CategoryId, name: '費用', amount: 1000 },
          ],
        },
        context: { userId },
      })
    })

    test('失敗すること', () => {
      expect(Result.isFailure(result)).toBe(true)
    })

    test('EventTemplateNotFoundException であること', () => {
      expect(Result.isFailure(result) && result.error).toBeInstanceOf(
        EventTemplateNotFoundException,
      )
    })
  })

  describe('異常系 - カテゴリが存在しない場合は失敗する', () => {
    const template = makeTemplate()
    const workflow = buildRegisterEventTemplateWorkflow({
      findEventTemplateById: () => Promise.resolve(template),
      findCategoriesByIds: () => Promise.resolve(new Map()),
    })

    let result: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      result = await workflow({
        input: {
          id: template.id,
          occurredOn: '2026-04-01',
          items: [
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
})
