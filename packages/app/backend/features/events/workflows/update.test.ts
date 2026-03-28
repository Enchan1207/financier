import type { Event, EventId } from '@backend/domains/event'
import type { UserId } from '@backend/domains/user'
import dayjs from '@backend/lib/date'
import { Result } from '@praha/byethrow'
import { beforeAll, describe, expect, test } from 'vitest'

import { EventNotFoundException } from '../exceptions'
import type { UpdateEventCommand } from './update'
import { buildUpdateEventWorkflow } from './update'

const TEST_USER_ID = 'test-user-id-00000000001' as UserId

const makeEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 'test-event-id-000000000001' as EventId,
  userId: TEST_USER_ID,
  name: 'テストイベント',
  occurredOn: dayjs('2024-04-01'),
  ...overrides,
})

describe('buildUpdateEventWorkflow', () => {
  describe('正常系 - nameを更新できる', () => {
    const event = makeEvent()
    const command: UpdateEventCommand = {
      input: { id: event.id, name: '更新後イベント名' },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<ReturnType<ReturnType<typeof buildUpdateEventWorkflow>>>

    beforeAll(async () => {
      const workflow = buildUpdateEventWorkflow({
        findEventById: () => Promise.resolve(event),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('nameが更新されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.event.name).toBe('更新後イベント名')
    })

    test('occurredOnが保持されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.event.occurredOn.format('YYYY-MM-DD')).toBe(
        event.occurredOn.format('YYYY-MM-DD'),
      )
    })
  })

  describe('正常系 - occurredOnを更新できる', () => {
    const event = makeEvent()
    const command: UpdateEventCommand = {
      input: { id: event.id, occurredOn: '2024-05-01' },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<ReturnType<ReturnType<typeof buildUpdateEventWorkflow>>>

    beforeAll(async () => {
      const workflow = buildUpdateEventWorkflow({
        findEventById: () => Promise.resolve(event),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('occurredOnが更新されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.event.occurredOn.format('YYYY-MM-DD')).toBe(
        '2024-05-01',
      )
    })

    test('nameが保持されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.event.name).toBe(event.name)
    })
  })

  describe('正常系 - nameとoccurredOnを同時に更新できる', () => {
    const event = makeEvent()
    const command: UpdateEventCommand = {
      input: {
        id: event.id,
        name: '同時更新イベント',
        occurredOn: '2024-06-15',
      },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<ReturnType<ReturnType<typeof buildUpdateEventWorkflow>>>

    beforeAll(async () => {
      const workflow = buildUpdateEventWorkflow({
        findEventById: () => Promise.resolve(event),
      })
      actual = await workflow(command)
    })

    test('成功結果を返すこと', () => {
      expect(Result.isSuccess(actual)).toBe(true)
    })

    test('nameが更新されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.event.name).toBe('同時更新イベント')
    })

    test('occurredOnが更新されること', () => {
      if (Result.isFailure(actual)) throw new Error('Expected success')
      expect(actual.value.event.occurredOn.format('YYYY-MM-DD')).toBe(
        '2024-06-15',
      )
    })
  })

  describe('異常系 - イベントが存在しない', () => {
    const command: UpdateEventCommand = {
      input: { id: 'non-existent-event-id-00001' as EventId, name: '更新名' },
      context: { userId: TEST_USER_ID },
    }

    let actual: Awaited<ReturnType<ReturnType<typeof buildUpdateEventWorkflow>>>

    beforeAll(async () => {
      const workflow = buildUpdateEventWorkflow({
        findEventById: () => Promise.resolve(undefined),
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
})
