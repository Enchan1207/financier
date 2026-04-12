import type { Category, CategoryId } from '@backend/domains/category'
import type {
  EventTemplate,
  EventTemplateId,
  TemplateTransaction,
} from '@backend/domains/event-template'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'

import {
  EventTemplateNotFoundException,
  EventTemplateValidationException,
} from '../exceptions'

// MARK: command

export type UpdateEventTemplateCommand = {
  input: {
    id: EventTemplateId
    name?: string | undefined
    defaultTransactions?:
      | Array<{
          categoryId: CategoryId
          name: string
          amount: number
        }>
      | undefined
  }
  context: {
    userId: UserId
  }
}

// MARK: step types

type TemplateResolved = {
  input: {
    name: string
    defaultTransactions: TemplateTransaction[]
  }
  context: {
    userId: UserId
    template: EventTemplate
  }
}

// MARK: event

export type EventTemplateUpdatedEvent = {
  template: EventTemplate
}

// MARK: effects

type Effects = {
  findEventTemplateById: (
    id: EventTemplateId,
    userId: UserId,
  ) => Promise<EventTemplate | undefined>
  findCategoriesByIds: (
    ids: string[],
    userId: UserId,
  ) => Promise<Map<string, Category>>
}

// MARK: workflow type

type Workflow = (
  command: UpdateEventTemplateCommand,
) => Result.ResultAsync<
  EventTemplateUpdatedEvent,
  EventTemplateNotFoundException | EventTemplateValidationException
>

// MARK: steps

const resolveTemplate =
  (effects: Effects) =>
  async (
    command: UpdateEventTemplateCommand,
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
      input: {
        name: command.input.name ?? template.name,
        defaultTransactions:
          command.input.defaultTransactions?.map((tx) => ({
            categoryId: tx.categoryId,
            name: tx.name,
            amount: tx.amount,
          })) ?? template.defaultTransactions,
      },
      context: { userId: command.context.userId, template },
    })
  }

const resolveCategories =
  (effects: Effects) =>
  async (
    resolved: TemplateResolved,
  ): Result.ResultAsync<TemplateResolved, EventTemplateValidationException> => {
    const ids = resolved.input.defaultTransactions.map((tx) => tx.categoryId)
    const categoryMap = await effects.findCategoriesByIds(
      ids,
      resolved.context.userId,
    )
    for (const tx of resolved.input.defaultTransactions) {
      const category = categoryMap.get(tx.categoryId)
      if (!category) {
        return Result.fail(
          new EventTemplateValidationException(
            `カテゴリが見つかりません: ${tx.categoryId}`,
          ),
        )
      }
      if (category.type === 'saving') {
        return Result.fail(
          new EventTemplateValidationException(
            `積立カテゴリはテンプレートに指定できません: ${tx.categoryId}`,
          ),
        )
      }
    }
    return Result.succeed(resolved)
  }

const buildUpdatedTemplate = (
  resolved: TemplateResolved,
): EventTemplateUpdatedEvent => ({
  template: {
    ...resolved.context.template,
    name: resolved.input.name,
    defaultTransactions: resolved.input.defaultTransactions,
  },
})

// MARK: definition

export const buildUpdateEventTemplateWorkflow =
  (effects: Effects): Workflow =>
  (command) =>
    Result.pipe(
      Result.succeed(command),
      Result.andThen(resolveTemplate(effects)),
      Result.andThen(resolveCategories(effects)),
      Result.map(buildUpdatedTemplate),
    )
