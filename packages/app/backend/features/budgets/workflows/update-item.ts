import type { Budget } from '@backend/domains/budget'
import type { Category, CategoryId } from '@backend/domains/category'
import type { FiscalYear, FiscalYearId } from '@backend/domains/fiscal-year'
import { createFiscalYear } from '@backend/domains/fiscal-year'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'

import {
  BudgetValidationException,
  FiscalYearClosedException,
} from '../exceptions'

// MARK: command

export type UpdateBudgetItemCommand = {
  input: {
    year: number
    categoryId: CategoryId
    budgetAmount: number
  }
  context: {
    userId: UserId
  }
}

// MARK: step types

type FiscalYearResolved = {
  input: UpdateBudgetItemCommand['input']
  context: {
    userId: UserId
    fiscalYear: FiscalYear
    isNewFiscalYear: boolean
  }
}

type CategoryResolved = {
  context: {
    userId: UserId
    fiscalYear: FiscalYear
    isNewFiscalYear: boolean
    category: Category
    categoryId: CategoryId
    budgetAmount: number
  }
}

type BudgetsAndCategoriesResolved = {
  context: {
    userId: UserId
    fiscalYear: FiscalYear
    isNewFiscalYear: boolean
    category: Category
    categoryId: CategoryId
    budgetAmount: number
    existingBudgets: Budget[]
    existingCategories: Map<CategoryId, Category>
  }
}

// MARK: event

export type BudgetItemUpdatedEvent = {
  fiscalYear: FiscalYear
  isNewFiscalYear: boolean
  budget: Budget
}

// MARK: effects

type Effects = {
  findFiscalYearByYear: (
    userId: UserId,
    year: number,
  ) => Promise<FiscalYear | undefined>
  findCategoryById: (
    id: CategoryId,
    userId: UserId,
  ) => Promise<Category | undefined>
  findBudgetsByFiscalYearId: (
    userId: UserId,
    fiscalYearId: FiscalYearId,
  ) => Promise<Budget[]>
  findCategoriesByIds: (
    ids: CategoryId[],
    userId: UserId,
  ) => Promise<Map<CategoryId, Category>>
}

// MARK: workflow type

type Workflow = (
  command: UpdateBudgetItemCommand,
) => Result.ResultAsync<
  BudgetItemUpdatedEvent,
  FiscalYearClosedException | BudgetValidationException
>

// MARK: steps

const resolveFiscalYear =
  (effects: Effects) =>
  async (
    command: UpdateBudgetItemCommand,
  ): Result.ResultAsync<FiscalYearResolved, FiscalYearClosedException> => {
    const existing = await effects.findFiscalYearByYear(
      command.context.userId,
      command.input.year,
    )

    if (existing) {
      if (existing.status === 'closed') {
        return Result.fail(
          new FiscalYearClosedException(
            `年度${command.input.year}は既に締め済みです`,
          ),
        )
      }
      return Result.succeed({
        input: command.input,
        context: {
          userId: command.context.userId,
          fiscalYear: existing,
          isNewFiscalYear: false,
        },
      })
    }

    const newFiscalYear = createFiscalYear(
      command.context.userId,
      command.input.year,
    )
    return Result.succeed({
      input: command.input,
      context: {
        userId: command.context.userId,
        fiscalYear: newFiscalYear,
        isNewFiscalYear: true,
      },
    })
  }

const resolveCategory =
  (effects: Effects) =>
  async (
    resolved: FiscalYearResolved,
  ): Result.ResultAsync<CategoryResolved, BudgetValidationException> => {
    const category = await effects.findCategoryById(
      resolved.input.categoryId,
      resolved.context.userId,
    )

    if (!category) {
      return Result.fail(
        new BudgetValidationException(
          `カテゴリが見つかりません: ${resolved.input.categoryId}`,
        ),
      )
    }

    return Result.succeed({
      context: {
        userId: resolved.context.userId,
        fiscalYear: resolved.context.fiscalYear,
        isNewFiscalYear: resolved.context.isNewFiscalYear,
        category,
        categoryId: resolved.input.categoryId,
        budgetAmount: resolved.input.budgetAmount,
      },
    })
  }

const resolveBudgetsAndCategories =
  (effects: Effects) =>
  async (
    resolved: CategoryResolved,
  ): Result.ResultAsync<BudgetsAndCategoriesResolved, never> => {
    const existingBudgets = await effects.findBudgetsByFiscalYearId(
      resolved.context.userId,
      resolved.context.fiscalYear.id,
    )

    const existingCategoryIds = existingBudgets
      .map((b) => b.categoryId)
      .filter((id) => id !== resolved.context.categoryId)

    const existingCategories = await effects.findCategoriesByIds(
      existingCategoryIds,
      resolved.context.userId,
    )

    return Result.succeed({
      context: {
        ...resolved.context,
        existingBudgets,
        existingCategories,
      },
    })
  }

const checkBudgetBalance = (
  resolved: BudgetsAndCategoriesResolved,
): Result.Result<BudgetsAndCategoriesResolved, BudgetValidationException> => {
  let incomeTotal = 0
  let expenseTotal = 0

  for (const budget of resolved.context.existingBudgets) {
    if (budget.categoryId === resolved.context.categoryId) continue

    const category = resolved.context.existingCategories.get(budget.categoryId)
    if (!category) continue

    if (category.type === 'income') {
      incomeTotal += budget.budgetAmount
    } else if (category.type === 'expense') {
      expenseTotal += budget.budgetAmount
    }
  }

  if (resolved.context.category.type === 'income') {
    incomeTotal += resolved.context.budgetAmount
  } else if (resolved.context.category.type === 'expense') {
    expenseTotal += resolved.context.budgetAmount
  }

  if (expenseTotal > incomeTotal) {
    return Result.fail(
      new BudgetValidationException(
        `支出予算合計（${expenseTotal}円）が収入予算合計（${incomeTotal}円）を超えています`,
      ),
    )
  }

  return Result.succeed(resolved)
}

const createEvent = (
  resolved: BudgetsAndCategoriesResolved,
): BudgetItemUpdatedEvent => ({
  fiscalYear: resolved.context.fiscalYear,
  isNewFiscalYear: resolved.context.isNewFiscalYear,
  budget: {
    userId: resolved.context.userId,
    fiscalYearId: resolved.context.fiscalYear.id,
    categoryId: resolved.context.categoryId,
    budgetAmount: resolved.context.budgetAmount,
  },
})

// MARK: definition

export const buildUpdateBudgetItemWorkflow =
  (effects: Effects): Workflow =>
  (command) =>
    Result.pipe(
      Result.succeed(command),
      Result.andThen(resolveFiscalYear(effects)),
      Result.andThen(resolveCategory(effects)),
      Result.andThen(resolveBudgetsAndCategories(effects)),
      Result.andThen(checkBudgetBalance),
      Result.map(createEvent),
    )
