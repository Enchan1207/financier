import type { Event, EventId } from '@backend/domains/event'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'

import { EventNotFoundException, EventValidationException } from '../exceptions'

// MARK: command

export type DeleteEventCommand = {
  input: {
    id: EventId
  }
  context: {
    userId: UserId
  }
}

// MARK: step types

type EventResolved = {
  input: {
    event: Event
  }
  context: {
    userId: UserId
  }
}

// MARK: event

export type EventDeletedEvent = {
  event: Event
}

// MARK: effects

type Effects = {
  findEventById: (id: EventId, userId: UserId) => Promise<Event | undefined>
  findTransactionCountByEventId: (
    eventId: EventId,
    userId: UserId,
  ) => Promise<number>
}

// MARK: workflow type

type Workflow = (
  command: DeleteEventCommand,
) => Result.ResultAsync<
  EventDeletedEvent,
  EventNotFoundException | EventValidationException
>

// MARK: steps

const resolveEvent =
  (effects: Effects) =>
  async (
    command: DeleteEventCommand,
  ): Result.ResultAsync<EventResolved, EventNotFoundException> => {
    const event = await effects.findEventById(
      command.input.id,
      command.context.userId,
    )
    if (!event) {
      return Result.fail(
        new EventNotFoundException(
          `イベントが見つかりません: ${command.input.id}`,
        ),
      )
    }
    return Result.succeed({
      input: { event },
      context: { userId: command.context.userId },
    })
  }

const checkNoTransactions =
  (effects: Effects) =>
  async (
    resolved: EventResolved,
  ): Result.ResultAsync<EventResolved, EventValidationException> => {
    const count = await effects.findTransactionCountByEventId(
      resolved.input.event.id,
      resolved.context.userId,
    )
    if (count > 0) {
      return Result.fail(
        new EventValidationException(
          'トランザクションが紐づいているイベントは削除できません',
        ),
      )
    }
    return Result.succeed(resolved)
  }

const buildDeletedEvent = (resolved: EventResolved): EventDeletedEvent => ({
  event: resolved.input.event,
})

// MARK: definition

export const buildDeleteEventWorkflow =
  (effects: Effects): Workflow =>
  (command) =>
    Result.pipe(
      Result.succeed(command),
      Result.andThen(resolveEvent(effects)),
      Result.andThen(checkNoTransactions(effects)),
      Result.map(buildDeletedEvent),
    )
