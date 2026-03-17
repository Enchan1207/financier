import type {
  Category,
  CategoryColor,
  CategoryIcon,
  CategoryId,
} from '@backend/domains/category'
import { Result } from '@praha/byethrow'

import {
  CategoryNotFoundException,
  CategoryValidationException,
} from '../exceptions'

// MARK: command

export type UpdateCategoryCommand = {
  id: CategoryId
  name: string
  icon: CategoryIcon
  color: CategoryColor
}

// MARK: event

export type CategoryUpdatedEvent = {
  category: Category
}

// MARK: effects

type Effects = {
  findCategoryById: (id: CategoryId) => Promise<Category | undefined>
}

// MARK: definition

export const buildUpdateCategoryWorkflow =
  (effects: Effects) =>
  async (
    command: UpdateCategoryCommand,
  ): Result.ResultAsync<
    CategoryUpdatedEvent,
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
        new CategoryValidationException(
          'アーカイブ済みカテゴリは編集できません',
        ),
      )
    }

    const updated: Category = {
      ...target,
      name: command.name,
      icon: command.icon,
      color: command.color,
    }

    return Result.succeed({ category: updated })
  }
