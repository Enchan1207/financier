import type { Category, CategoryId } from '@backend/domains/category'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'

import type { CategoryReferences } from '../exceptions'
import {
  CategoryHasReferencesException,
  CategoryNotFoundException,
} from '../exceptions'

// MARK: command

export type DeleteCategoryCommand = {
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
    references: CategoryReferences
  }
}

// MARK: event

export type CategoryDeletedEvent = {
  categoryId: CategoryId
}

// MARK: effects

type Effects = {
  findCategoryById: (
    id: CategoryId,
    userId: UserId,
  ) => Promise<Category | undefined>
  countCategoryReferences: (id: CategoryId) => Promise<CategoryReferences>
}

// MARK: workflow type

type Workflow = (
  command: DeleteCategoryCommand,
) => Result.ResultAsync<
  CategoryDeletedEvent,
  CategoryNotFoundException | CategoryHasReferencesException
>

// MARK: steps

const resolveCategory =
  (effects: Effects) =>
  async (
    command: DeleteCategoryCommand,
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
    const references = await effects.countCategoryReferences(command.input.id)
    return Result.succeed({
      context: { userId: command.context.userId, category: target, references },
    })
  }

const checkReferences = (
  resolved: CategoryResolved,
): Result.Result<CategoryDeletedEvent, CategoryHasReferencesException> => {
  const { references, category } = resolved.context
  if (
    references.transactions ||
    references.budgets ||
    references.savingDefinitions
  ) {
    const kinds: string[] = []
    if (references.transactions) kinds.push('トランザクション')
    if (references.budgets) kinds.push('予算')
    if (references.savingDefinitions) kinds.push('積立定義')
    return Result.fail(
      new CategoryHasReferencesException(
        references,
        `カテゴリ「${category.name}」は ${kinds.join('・')} から参照されているため削除できません`,
      ),
    )
  }
  return Result.succeed({ categoryId: resolved.context.category.id })
}

// MARK: definition

export const buildDeleteCategoryWorkflow =
  (effects: Effects): Workflow =>
  (command) =>
    Result.pipe(
      Result.succeed(command),
      Result.andThen(resolveCategory(effects)),
      Result.andThen(checkReferences),
    )
