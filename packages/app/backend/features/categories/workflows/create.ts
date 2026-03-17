import type {
  Category,
  CategoryColor,
  CategoryIcon,
} from '@backend/domains/category'
import {
  createExpenseCategory,
  createIncomeCategory,
  createSavingCategory,
} from '@backend/domains/category'
import { Result } from '@praha/byethrow'

import { CategoryConflictException } from '../exceptions'

// MARK: command

export type CreateCategoryCommand = {
  type: 'income' | 'expense' | 'saving'
  name: string
  icon: CategoryIcon
  color: CategoryColor
}

// MARK: event

export type CategoryCreatedEvent = {
  category: Category
}

// MARK: effects

type Effects = {
  findCategoryByName: (name: string) => Promise<Category | undefined>
}

// MARK: definition

export const buildCreateCategoryWorkflow =
  (effects: Effects) =>
  async (
    command: CreateCategoryCommand,
  ): Result.ResultAsync<CategoryCreatedEvent, CategoryConflictException> => {
    const existing = await effects.findCategoryByName(command.name)
    if (existing) {
      return Result.fail(
        new CategoryConflictException(
          `カテゴリ名「${command.name}」はすでに存在します`,
        ),
      )
    }

    const { name, icon, color } = command
    const category =
      command.type === 'income'
        ? createIncomeCategory({ type: 'income', name, icon, color })
        : command.type === 'saving'
          ? createSavingCategory({ type: 'saving', name, icon, color })
          : createExpenseCategory({ type: 'expense', name, icon, color })

    return Result.succeed({ category })
  }
