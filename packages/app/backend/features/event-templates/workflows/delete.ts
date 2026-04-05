import type {
  EventTemplate,
  EventTemplateId,
} from '@backend/domains/event-template'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'

import { EventTemplateNotFoundException } from '../exceptions'

// MARK: command

export type DeleteEventTemplateCommand = {
  input: {
    id: EventTemplateId
  }
  context: {
    userId: UserId
  }
}

// MARK: step types

type TemplateResolved = {
  input: {
    template: EventTemplate
  }
  context: {
    userId: UserId
  }
}

// MARK: event

export type EventTemplateDeletedEvent = {
  template: EventTemplate
}

// MARK: effects

type Effects = {
  findEventTemplateById: (
    id: EventTemplateId,
    userId: UserId,
  ) => Promise<EventTemplate | undefined>
}

// MARK: workflow type

type Workflow = (
  command: DeleteEventTemplateCommand,
) => Result.ResultAsync<
  EventTemplateDeletedEvent,
  EventTemplateNotFoundException
>

// MARK: steps

const resolveTemplate =
  (effects: Effects) =>
  async (
    command: DeleteEventTemplateCommand,
  ): Result.ResultAsync<TemplateResolved, EventTemplateNotFoundException> => {
    const template = await effects.findEventTemplateById(
      command.input.id,
      command.context.userId,
    )
    if (!template) {
      return Result.fail(
        new EventTemplateNotFoundException(
          `イベントテンプレートが見つかりません: ${command.input.id}`,
        ),
      )
    }
    return Result.succeed({
      input: { template },
      context: { userId: command.context.userId },
    })
  }

const buildDeletedTemplate = (
  resolved: TemplateResolved,
): EventTemplateDeletedEvent => ({
  template: resolved.input.template,
})

// MARK: definition

export const buildDeleteEventTemplateWorkflow =
  (effects: Effects): Workflow =>
  (command) =>
    Result.pipe(
      Result.succeed(command),
      Result.andThen(resolveTemplate(effects)),
      Result.map(buildDeletedTemplate),
    )
