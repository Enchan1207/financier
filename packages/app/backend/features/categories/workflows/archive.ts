import type { Category, CategoryId } from '@backend/domains/category'
import { Result } from '@praha/byethrow'

import {
  CategoryNotFoundException,
  CategoryValidationException,
} from '../exceptions'

// MARK: command

export type ArchiveCategoryCommand = {
  id: CategoryId
}

// MARK: event

export type CategoryArchivedEvent = {
  category: Category
}

// MARK: effects

type Effects = {
  findCategoryById: (id: CategoryId) => Promise<Category | undefined>
}

// MARK: definition

export const buildArchiveCategoryWorkflow =
  (effects: Effects) =>
  async (
    command: ArchiveCategoryCommand,
  ): Result.ResultAsync<
    CategoryArchivedEvent,
    CategoryNotFoundException | CategoryValidationException
  > => {
    const target = await effects.findCategoryById(command.id)
    if (!target) {
      return Result.fail(
        new CategoryNotFoundException(
          `カテゴリが見つかりません: ${command.id}`,
        ),
      )
    }

    if (target.status !== 'active') {
      return Result.fail(
        new CategoryValidationException('すでにアーカイブ済みのカテゴリです'),
      )
    }

    return Result.succeed({ category: { ...target, status: 'archived' } })
  }
