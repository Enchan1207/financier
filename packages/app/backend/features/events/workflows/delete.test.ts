import type { Event, EventId } from '@backend/domains/event'
import type { UserId } from '@backend/domains/user'
import dayjs from '@backend/lib/date'
import { Result } from '@praha/byethrow'
import { beforeAll, describe, expect, test } from 'vitest'

import { EventNotFoundException, EventValidationException } from '../exceptions'
import type { DeleteEventCommand } from './delete'
import { buildDeleteEventWorkflow } from './delete'

const TEST_USER_ID = 'test-user-id-00000000001' as UserId

const makeEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 'test-event-id-000000000001' as EventId,
  userId: TEST_USER_ID,
  name: 'テストイベント',
  occurredOn: dayjs('2024-04-01'),
  ...overrides,
})

describe('buildDeleteEventWorkflow', () => {
  describe('正常系 - イベントを削除できる', () => {
    const event = makeEvent()
    const command: DeleteEventCommand = {
      input: { id: event.id },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<ReturnType<ReturnType<typeof buildDeleteEventWorkflow>>>

    beforeAll(async () => {
      const workflow = buildDeleteEventWorkflow({
        findEventById: () => Promise.resolve(event),
        findTransactionCountByEventId: () => Promise.resolve(0),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('削除されたイベントが返ること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.event.id).toBe(event.id)
    })
  })

  describe('異常系 - イベントが存在しない', () => {
    const command: DeleteEventCommand = {
      input: { id: 'non-existent-event-id-00001' as EventId },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<ReturnType<ReturnType<typeof buildDeleteEventWorkflow>>>

    beforeAll(async () => {
      const workflow = buildDeleteEventWorkflow({
        findEventById: () => Promise.resolve(undefined),
        findTransactionCountByEventId: () => Promise.resolve(0),
      })
      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラーがEventNotFoundExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error).toBeInstanceOf(EventNotFoundException)
    })

    test('エラーメッセージにイベントIDが含まれること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error.message).toContain(command.input.id)
    })
  })

  describe('異常系 - トランザクションが紐づいている', () => {
    const event = makeEvent()
    const command: DeleteEventCommand = {
      input: { id: event.id },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<ReturnType<ReturnType<typeof buildDeleteEventWorkflow>>>

    beforeAll(async () => {
      const workflow = buildDeleteEventWorkflow({
        findEventById: () => Promise.resolve(event),
        findTransactionCountByEventId: () => Promise.resolve(3),
      })
      actual = await workflow(command)
    })

    test('失敗結果を返すこと', () => {
      expect(Result.isFailure(actual)).toBe(true)
    })

    test('エラーがEventValidationExceptionであること', () => {
      if (Result.isSuccess(actual)) throw new Error('Expected failure')
      expect(actual.error).toBeInstanceOf(EventValidationException)
    })
  })
})
