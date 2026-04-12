import type { Budget } from '@backend/domains/budget'
import type { CategoryId } from '@backend/domains/category'
import type { FiscalYearId } from '@backend/domains/fiscal-year'
import type { UserId } from '@backend/domains/user'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { budgetsTable } from '@backend/schemas/budgets'
import { and, eq } from 'drizzle-orm'

const createBudgetModel = (record: {
  user_id: string
  fiscal_year_id: string
  category_id: string
  budget_amount: number
}): Budget => ({
  userId: record.user_id as UserId,
  fiscalYearId: record.fiscal_year_id as FiscalYearId,
  categoryId: record.category_id as CategoryId,
  budgetAmount: record.budget_amount,
})

export const findBudgetsByFiscalYearId =
  (db: DrizzleDatabase) =>
  async (userId: UserId, fiscalYearId: FiscalYearId): Promise<Budget[]> => {
    const results = await db
      .select()
      .from(budgetsTable)
      .where(
        and(
          eq(budgetsTable.user_id, userId),
          eq(budgetsTable.fiscal_year_id, fiscalYearId),
        ),
      )
    return results.map(createBudgetModel)
  }

export const findBudgetByCategoryId =
  (db: DrizzleDatabase) =>
  async (
    userId: UserId,
    fiscalYearId: FiscalYearId,
    categoryId: CategoryId,
  ): Promise<Budget | undefined> => {
    const results = await db
      .select()
      .from(budgetsTable)
      .where(
        and(
          eq(budgetsTable.user_id, userId),
          eq(budgetsTable.fiscal_year_id, fiscalYearId),
          eq(budgetsTable.category_id, categoryId),
        ),
      )
    const row = results[0]
    return row ? createBudgetModel(row) : undefined
  }

export const saveBudget =
  (db: DrizzleDatabase) =>
  async (budget: Budget): Promise<void> => {
    await db
      .insert(budgetsTable)
      .values({
        user_id: budget.userId,
        fiscal_year_id: budget.fiscalYearId,
        category_id: budget.categoryId,
        budget_amount: budget.budgetAmount,
      })
      .onConflictDoUpdate({
        target: [
          budgetsTable.user_id,
          budgetsTable.fiscal_year_id,
          budgetsTable.category_id,
        ],
        set: {
          budget_amount: budget.budgetAmount,
        },
      })
  }

export const saveBudgets =
  (db: DrizzleDatabase) =>
  async (budgets: Budget[]): Promise<void> => {
    if (budgets.length === 0) return
    for (const budget of budgets) {
      await saveBudget(db)(budget)
    }
  }

export const deleteBudgetsByFiscalYearId =
  (db: DrizzleDatabase) =>
  async (userId: UserId, fiscalYearId: FiscalYearId): Promise<void> => {
    await db
      .delete(budgetsTable)
      .where(
        and(
          eq(budgetsTable.user_id, userId),
          eq(budgetsTable.fiscal_year_id, fiscalYearId),
        ),
      )
  }
