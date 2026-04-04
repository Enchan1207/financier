import type {
  Category,
  CategoryColor,
  CategoryIcon,
  CategoryId,
} from '@backend/domains/category'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'

import { CategoryNotFoundException } from '../exceptions'

// MARK: command

export type UpdateCategoryCommand = {
  input: {
    id: CategoryId
    name: string
    icon: CategoryIcon
    color: CategoryColor
  }
  context: {
    userId: UserId
  }
}

// MARK: step types

type CategoryResolved = {
  input: {
    name: string
    icon: CategoryIcon
    color: CategoryColor
  }
  context: {
    userId: UserId
    category: Category
  }
}

// MARK: event

export type CategoryUpdatedEvent = {
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
  command: UpdateCategoryCommand,
) => Result.ResultAsync<CategoryUpdatedEvent, CategoryNotFoundException>

// MARK: steps

const resolveCategory =
  (effects: Effects) =>
  async (
    command: UpdateCategoryCommand,
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
      input: {
        name: command.input.name,
        icon: command.input.icon,
        color: command.input.color,
      },
      context: { userId: command.context.userId, category: target },
    })
  }

const createEvent = (resolved: CategoryResolved): CategoryUpdatedEvent => ({
  category: {
    ...resolved.context.category,
    name: resolved.input.name,
    icon: resolved.input.icon,
    color: resolved.input.color,
  },
})

// MARK: definition

export const buildUpdateCategoryWorkflow =
  (effects: Effects): Workflow =>
  (command) =>
    Result.pipe(
      Result.succeed(command),
      Result.andThen(resolveCategory(effects)),
      Result.map(createEvent),
    )
