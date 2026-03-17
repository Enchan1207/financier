import type {
  ActiveCategory,
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

// MARK: step types

type CategoryResolved = {
  input: {
    name: string
    icon: CategoryIcon
    color: CategoryColor
  }
  context: {
    category: Category
  }
}

type StatusChecked = {
  input: {
    name: string
    icon: CategoryIcon
    color: CategoryColor
  }
  context: {
    category: ActiveCategory
  }
}

// MARK: event

export type CategoryUpdatedEvent = {
  category: Category
}

// MARK: effects

type Effects = {
  findCategoryById: (id: CategoryId) => Promise<Category | undefined>
}

// MARK: workflow type

type Workflow = (
  command: UpdateCategoryCommand,
) => Result.ResultAsync<
  CategoryUpdatedEvent,
  CategoryNotFoundException | CategoryValidationException
>

// MARK: steps

const resolveCategory =
  (effects: Effects) =>
  async (
    command: UpdateCategoryCommand,
  ): Result.ResultAsync<CategoryResolved, CategoryNotFoundException> => {
    const target = await effects.findCategoryById(command.id)
    if (!target) {
      return Result.fail(
        new CategoryNotFoundException(
          `カテゴリが見つかりません: ${command.id}`,
        ),
      )
    }
    return Result.succeed({
      input: { name: command.name, icon: command.icon, color: command.color },
      context: { category: target },
    })
  }

const checkStatus = (
  resolved: CategoryResolved,
): Result.Result<StatusChecked, CategoryValidationException> => {
  if (resolved.context.category.status !== 'active') {
    return Result.fail(
      new CategoryValidationException('アーカイブ済みカテゴリは編集できません'),
    )
  }
  return Result.succeed({
    ...resolved,
    context: { category: resolved.context.category as ActiveCategory },
  })
}

const createEvent = (checked: StatusChecked): CategoryUpdatedEvent => ({
  category: {
    ...checked.context.category,
    name: checked.input.name,
    icon: checked.input.icon,
    color: checked.input.color,
  },
})

// MARK: definition

export const buildUpdateCategoryWorkflow =
  (effects: Effects): Workflow =>
  (command) =>
    Result.pipe(
      Result.succeed(command),
      Result.andThen(resolveCategory(effects)),
      Result.andThen(checkStatus),
      Result.map(createEvent),
    )
