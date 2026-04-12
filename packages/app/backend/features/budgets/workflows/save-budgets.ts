import type { Budget } from '@backend/domains/budget'
import type { Category, CategoryId } from '@backend/domains/category'
import type { FiscalYear } from '@backend/domains/fiscal-year'
import { createFiscalYear } from '@backend/domains/fiscal-year'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'

import {
  BudgetValidationException,
  FiscalYearClosedException,
} from '../exceptions'

// MARK: command

export type SaveBudgetsCommand = {
  input: {
    year: number
    items: { categoryId: CategoryId; budgetAmount: number }[]
  }
  context: {
    userId: UserId
  }
}

// MARK: step types

type FiscalYearResolved = {
  input: SaveBudgetsCommand['input']
  context: {
    userId: UserId
    fiscalYear: FiscalYear
    isNewFiscalYear: boolean
  }
}

type CategoriesResolved = {
  context: {
    userId: UserId
    fiscalYear: FiscalYear
    isNewFiscalYear: boolean
    categories: Map<CategoryId, Category>
    items: { categoryId: CategoryId; budgetAmount: number }[]
  }
}

// MARK: event

export type BudgetsSavedEvent = {
  fiscalYear: FiscalYear
  isNewFiscalYear: boolean
  budgets: Budget[]
}

// MARK: effects

type Effects = {
  findFiscalYearByYear: (
    userId: UserId,
    year: number,
  ) => Promise<FiscalYear | undefined>
  findCategoriesByIds: (
    ids: CategoryId[],
    userId: UserId,
  ) => Promise<Map<CategoryId, Category>>
}

// MARK: workflow type

type Workflow = (
  command: SaveBudgetsCommand,
) => Result.ResultAsync<
  BudgetsSavedEvent,
  FiscalYearClosedException | BudgetValidationException
>

// MARK: steps

const resolveFiscalYear =
  (effects: Effects) =>
  async (
    command: SaveBudgetsCommand,
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

const resolveCategories =
  (effects: Effects) =>
  async (
    resolved: FiscalYearResolved,
  ): Result.ResultAsync<CategoriesResolved, BudgetValidationException> => {
    const categoryIds = resolved.input.items.map((item) => item.categoryId)
    const categories = await effects.findCategoriesByIds(
      categoryIds,
      resolved.context.userId,
    )

    for (const item of resolved.input.items) {
      if (!categories.has(item.categoryId)) {
        return Result.fail(
          new BudgetValidationException(
            `カテゴリが見つかりません: ${item.categoryId}`,
          ),
        )
      }
    }

    return Result.succeed({
      context: {
        userId: resolved.context.userId,
        fiscalYear: resolved.context.fiscalYear,
        isNewFiscalYear: resolved.context.isNewFiscalYear,
        categories,
        items: resolved.input.items,
      },
    })
  }

const checkBudgetBalance = (
  resolved: CategoriesResolved,
): Result.Result<CategoriesResolved, BudgetValidationException> => {
  let incomeTotal = 0
  let expenseTotal = 0

  for (const item of resolved.context.items) {
    const category = resolved.context.categories.get(item.categoryId)
    if (!category) continue

    if (category.type === 'income') {
      incomeTotal += item.budgetAmount
    } else if (category.type === 'expense') {
      expenseTotal += item.budgetAmount
    }
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

const createEvent = (resolved: CategoriesResolved): BudgetsSavedEvent => ({
  fiscalYear: resolved.context.fiscalYear,
  isNewFiscalYear: resolved.context.isNewFiscalYear,
  budgets: resolved.context.items.map((item) => ({
    userId: resolved.context.userId,
    fiscalYearId: resolved.context.fiscalYear.id,
    categoryId: item.categoryId,
    budgetAmount: item.budgetAmount,
  })),
})

// MARK: definition

export const buildSaveBudgetsWorkflow =
  (effects: Effects): Workflow =>
  (command) =>
    Result.pipe(
      Result.succeed(command),
      Result.andThen(resolveFiscalYear(effects)),
      Result.andThen(resolveCategories(effects)),
      Result.andThen(checkBudgetBalance),
      Result.map(createEvent),
    )
