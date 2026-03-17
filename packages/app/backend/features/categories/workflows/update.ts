import type {
  Category,
  CategoryColor,
  CategoryIcon,
  CategoryId,
} from '@backend/domains/category'
import { Result } from '@praha/byethrow'

import {
  CategoryConflictException,
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
  findCategoryByName: (name: string) => Promise<Category | undefined>
}

// MARK: definition

export const buildUpdateCategoryWorkflow =
  (effects: Effects) =>
  async (
    command: UpdateCategoryCommand,
  ): Result.ResultAsync<
    CategoryUpdatedEvent,
    | CategoryNotFoundException
    | CategoryValidationException
    | CategoryConflictException
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

    if (command.name !== target.name) {
      const existing = await effects.findCategoryByName(command.name)
      if (existing) {
        return Result.fail(
          new CategoryConflictException(
            `カテゴリ名「${command.name}」はすでに存在します`,
          ),
        )
      }
    }

    const updated: Category = {
      ...target,
      name: command.name,
      icon: command.icon,
      color: command.color,
    }

    return Result.succeed({ category: updated })
  }
