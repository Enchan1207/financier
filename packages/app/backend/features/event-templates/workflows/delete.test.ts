import type {
  EventTemplate,
  EventTemplateId,
} from '@backend/domains/event-template'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'
import { ulid } from 'ulid'
import { assert, describe, expect, test } from 'vitest'

import { EventTemplateNotFoundException } from '../exceptions'
import { buildDeleteEventTemplateWorkflow } from './delete'

const userId = `usr-${ulid()}` as UserId

const makeTemplate = (
  overrides: Partial<EventTemplate> = {},
): EventTemplate => ({
  id: `tpl-${ulid()}` as EventTemplateId,
  userId,
  name: '旅行テンプレート',
  defaultTransactions: [],
  ...overrides,
})

describe('buildDeleteEventTemplateWorkflow', () => {
  describe('正常系 - テンプレートを削除できる', () => {
    const template = makeTemplate()
    const workflow = buildDeleteEventTemplateWorkflow({
      findEventTemplateById: () => Promise.resolve(template),
    })

    let result: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      result = await workflow({
        input: { id: template.id },
        context: { userId },
      })
    })

    test('成功すること', () => {
      expect(Result.isSuccess(result)).toBe(true)
    })

    test('削除対象のテンプレートが返ること', () => {
      assert(Result.isSuccess(result))
      expect(result.value.template.id).toBe(template.id)
    })

    test('テンプレート名が正しいこと', () => {
      assert(Result.isSuccess(result))
      expect(result.value.template.name).toBe(template.name)
    })
  })

  describe('異常系 - テンプレートが存在しない場合は失敗する', () => {
    const workflow = buildDeleteEventTemplateWorkflow({
      findEventTemplateById: () => Promise.resolve(undefined),
    })

    let result: Awaited<ReturnType<typeof workflow>>

    beforeAll(async () => {
      result = await workflow({
        input: { id: 'non-existent' as EventTemplateId },
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
})
