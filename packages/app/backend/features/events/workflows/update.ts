import type { Event, EventId } from '@backend/domains/event'
import type { UserId } from '@backend/domains/user'
import dayjs from '@backend/lib/date'
import { Result } from '@praha/byethrow'

import { EventNotFoundException } from '../exceptions'

// MARK: command

export type UpdateEventCommand = {
  input: {
    id: EventId
    name?: string | undefined
    occurredOn?: string | undefined
  }
  context: {
    userId: UserId
  }
}

// MARK: step types

type EventResolved = {
  input: UpdateEventCommand['input']
  context: {
    event: Event
  }
}

// MARK: event

export type EventUpdatedEvent = {
  event: Event
}

// MARK: effects

type Effects = {
  findEventById: (id: EventId, userId: UserId) => Promise<Event | undefined>
}

// MARK: workflow type

type Workflow = (
  command: UpdateEventCommand,
) => Result.ResultAsync<EventUpdatedEvent, EventNotFoundException>

// MARK: steps

const resolveEvent =
  (effects: Effects) =>
  async (
    command: UpdateEventCommand,
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
    return Result.succeed({ input: command.input, context: { event } })
  }

const buildUpdatedEvent = (resolved: EventResolved): EventUpdatedEvent => ({
  event: {
    ...resolved.context.event,
    name: resolved.input.name ?? resolved.context.event.name,
    occurredOn: resolved.input.occurredOn
      ? dayjs(resolved.input.occurredOn)
      : resolved.context.event.occurredOn,
  },
})

// MARK: definition

export const buildUpdateEventWorkflow =
  (effects: Effects): Workflow =>
  (command) =>
    Result.pipe(
      Result.succeed(command),
      Result.andThen(resolveEvent(effects)),
      Result.map(buildUpdatedEvent),
    )
