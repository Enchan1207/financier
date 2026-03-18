import type {
  ActiveCategory,
  Category,
  CategoryId,
} from '@backend/domains/category'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'

import {
  CategoryNotFoundException,
  CategoryValidationException,
} from '../exceptions'

// MARK: command

export type ArchiveCategoryCommand = {
  input: {
    id: CategoryId
  }
  context: {
    userId: UserId
  }
}

// MARK: step types

type CategoryResolved = {
  context: {
    userId: UserId
    category: Category
  }
}

type StatusChecked = {
  context: {
    userId: UserId
    category: ActiveCategory
  }
}

// MARK: event

export type CategoryArchivedEvent = {
  category: Category
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
  command: ArchiveCategoryCommand,
) => Result.ResultAsync<
  CategoryArchivedEvent,
  CategoryNotFoundException | CategoryValidationException
>

// MARK: steps

const resolveCategory =
  (effects: Effects) =>
  async (
    command: ArchiveCategoryCommand,
  ): Result.ResultAsync<CategoryResolved, CategoryNotFoundException> => {
    const target = await effects.findCategoryById(
      command.input.id,
      command.context.userId,
    )
    if (!target) {
      return Result.fail(
        new CategoryNotFoundException(
          `カテゴリが見つかりません: ${command.input.id}`,
        ),
      )
    }
    return Result.succeed({
      context: { userId: command.context.userId, category: target },
    })
  }

const checkStatus = (
  resolved: CategoryResolved,
): Result.Result<StatusChecked, CategoryValidationException> => {
  if (resolved.context.category.status !== 'active') {
    return Result.fail(
      new CategoryValidationException('すでにアーカイブ済みのカテゴリです'),
    )
  }
  return Result.succeed({
    context: {
      ...resolved.context,
      category: resolved.context.category as ActiveCategory,
    },
  })
}

const createEvent = (checked: StatusChecked): CategoryArchivedEvent => ({
  category: { ...checked.context.category, status: 'archived' },
})

// MARK: definition

export const buildArchiveCategoryWorkflow =
  (effects: Effects): Workflow =>
  (command) =>
    Result.pipe(
      Result.succeed(command),
      Result.andThen(resolveCategory(effects)),
      Result.andThen(checkStatus),
      Result.map(createEvent),
    )
