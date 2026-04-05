import type { Category, CategoryId } from '@backend/domains/category'
import type {
  EventTemplate,
  TemplateTransaction,
} from '@backend/domains/event-template'
import { createEventTemplate } from '@backend/domains/event-template'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'

import { EventTemplateValidationException } from '../exceptions'

// MARK: command

export type CreateEventTemplateCommand = {
  input: {
    name: string
    defaultTransactions: Array<{
      categoryId: CategoryId
      name: string
      amount: number
    }>
  }
  context: {
    userId: UserId
  }
}

// MARK: step types

type CategoriesResolved = {
  input: {
    name: string
    defaultTransactions: Array<{
      categoryId: CategoryId
      name: string
      amount: number
    }>
  }
  context: {
    userId: UserId
  }
}

// MARK: event

export type EventTemplateCreatedEvent = {
  template: EventTemplate
}

// MARK: effects

type Effects = {
  findCategoryById: (
    id: CategoryId,
    userId: UserId,
  ) => Promise<Category | undefined>
}

// MARK: workflow type

type Workflow = (
  command: CreateEventTemplateCommand,
) => Result.ResultAsync<
  EventTemplateCreatedEvent,
  EventTemplateValidationException
>

// MARK: steps

const resolveCategories =
  (effects: Effects) =>
  async (
    command: CreateEventTemplateCommand,
  ): Result.ResultAsync<
    CategoriesResolved,
    EventTemplateValidationException
  > => {
    for (const tx of command.input.defaultTransactions) {
      const category = await effects.findCategoryById(
        tx.categoryId,
        command.context.userId,
      )
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
    return Result.succeed({
      input: command.input,
      context: { userId: command.context.userId },
    })
  }

const buildCreatedTemplate = (
  resolved: CategoriesResolved,
): EventTemplateCreatedEvent => {
  const defaultTransactions: TemplateTransaction[] =
    resolved.input.defaultTransactions.map((tx) => ({
      categoryId: tx.categoryId,
      name: tx.name,
      amount: tx.amount,
    }))
  const template = createEventTemplate({
    userId: resolved.context.userId,
    name: resolved.input.name,
    defaultTransactions,
  })
  return { template }
}

// MARK: definition

export const buildCreateEventTemplateWorkflow =
  (effects: Effects): Workflow =>
  (command) =>
    Result.pipe(
      Result.succeed(command),
      Result.andThen(resolveCategories(effects)),
      Result.map(buildCreatedTemplate),
    )
