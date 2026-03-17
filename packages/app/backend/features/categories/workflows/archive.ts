import type { ActiveCategory, Category, CategoryId } from '@backend/domains/category'
import { Result } from '@praha/byethrow'

import {
  CategoryNotFoundException,
  CategoryValidationException,
} from '../exceptions'

// MARK: command

export type ArchiveCategoryCommand = {
  id: CategoryId
}

// MARK: step types

type CategoryResolved = {
  category: Category
}

type StatusChecked = {
  category: ActiveCategory
}

// MARK: event

export type CategoryArchivedEvent = {
  category: Category
}

// MARK: effects

type Effects = {
  findCategoryById: (id: CategoryId) => Promise<Category | undefined>
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
    const target = await effects.findCategoryById(command.id)
    if (!target) {
      return Result.fail(
        new CategoryNotFoundException(
          `カテゴリが見つかりません: ${command.id}`,
        ),
      )
    }
    return Result.succeed({ category: target })
  }

const checkStatus = (
  resolved: CategoryResolved,
): Result.Result<StatusChecked, CategoryValidationException> => {
  if (resolved.category.status !== 'active') {
    return Result.fail(
      new CategoryValidationException('すでにアーカイブ済みのカテゴリです'),
    )
  }
  return Result.succeed({ category: resolved.category as ActiveCategory })
}

const createEvent = (checked: StatusChecked): CategoryArchivedEvent => ({
  category: { ...checked.category, status: 'archived' },
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
