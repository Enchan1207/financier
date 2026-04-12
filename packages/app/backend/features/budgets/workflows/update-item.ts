import type { Budget } from '@backend/domains/budget'
import type { CategoryId } from '@backend/domains/category'
import type { FiscalYear, FiscalYearId } from '@backend/domains/fiscal-year'
import { createFiscalYear } from '@backend/domains/fiscal-year'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'

import type { BudgetValidationException } from '../exceptions'
import {
  BudgetNotFoundException,
  FiscalYearClosedException,
} from '../exceptions'
import type { BudgetWithCategoryType } from '../repository'
import type { BudgetBalanceItem } from './logic'
import { checkBudgetBalance } from './logic'

// MARK: command

export type UpdateBudgetItemCommand = {
  input: {
    year: number
    categoryId: string
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
  }
}

type BudgetsResolved = {
  context: {
    userId: UserId
    fiscalYear: FiscalYear
    categoryId: CategoryId
    budgetAmount: number
    existingBudgets: BudgetWithCategoryType[]
  }
}

// MARK: event

export type BudgetItemUpdatedEvent = {
  fiscalYear: FiscalYear
  budget: Budget
}

// MARK: effects

type Effects = {
  findFiscalYearByYear: (
    userId: UserId,
    year: number,
  ) => Promise<FiscalYear | undefined>
  findBudgetsWithCategoryTypeByFiscalYearId: (
    userId: UserId,
    fiscalYearId: FiscalYearId,
  ) => Promise<BudgetWithCategoryType[]>
}

// MARK: workflow type

type Workflow = (
  command: UpdateBudgetItemCommand,
) => Result.ResultAsync<
  BudgetItemUpdatedEvent,
  | FiscalYearClosedException
  | BudgetValidationException
  | BudgetNotFoundException
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
        },
      })
    }

    // 年度が存在しない = 予算アイテムも存在しないため NotFound
    const newFiscalYear = createFiscalYear(
      command.context.userId,
      command.input.year,
    )
    return Result.succeed({
      input: command.input,
      context: {
        userId: command.context.userId,
        fiscalYear: newFiscalYear,
      },
    })
  }

const resolveBudgetsWithCategories =
  (effects: Effects) =>
  async (
    resolved: FiscalYearResolved,
  ): Result.ResultAsync<
    BudgetsResolved,
    BudgetValidationException | BudgetNotFoundException
  > => {
    const existingBudgets =
      await effects.findBudgetsWithCategoryTypeByFiscalYearId(
        resolved.context.userId,
        resolved.context.fiscalYear.id,
      )

    const targetBudget = existingBudgets.find(
      (b) => b.categoryId === resolved.input.categoryId,
    )
    if (!targetBudget) {
      return Result.fail(
        new BudgetNotFoundException(
          `予算アイテムが見つかりません: ${resolved.input.categoryId}`,
        ),
      )
    }

    return Result.succeed({
      context: {
        userId: resolved.context.userId,
        fiscalYear: resolved.context.fiscalYear,
        categoryId: resolved.input.categoryId as CategoryId,
        budgetAmount: resolved.input.budgetAmount,
        existingBudgets,
      },
    })
  }

const validateBudgetBalance = (
  resolved: BudgetsResolved,
): Result.Result<BudgetsResolved, BudgetValidationException> => {
  const balanceItems: BudgetBalanceItem[] =
    resolved.context.existingBudgets.map((b) => ({
      budgetAmount:
        b.categoryId === resolved.context.categoryId
          ? resolved.context.budgetAmount
          : b.budgetAmount,
      categoryType: b.categoryType,
    }))

  const balanceResult = checkBudgetBalance(balanceItems)
  if (Result.isFailure(balanceResult)) {
    return Result.fail(balanceResult.error)
  }

  return Result.succeed(resolved)
}

const createEvent = (resolved: BudgetsResolved): BudgetItemUpdatedEvent => ({
  fiscalYear: resolved.context.fiscalYear,
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
      Result.andThen(resolveBudgetsWithCategories(effects)),
      Result.andThen(validateBudgetBalance),
      Result.map(createEvent),
    )
