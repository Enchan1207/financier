import type { Budget } from '@backend/domains/budget'
import type { CategoryId } from '@backend/domains/category'
import type { FiscalYear, FiscalYearId } from '@backend/domains/fiscal-year'
import type { UserId } from '@backend/domains/user'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { budgetsTable } from '@backend/schemas/budgets'
import { categoriesTable } from '@backend/schemas/categories'
import { fiscalYearsTable } from '@backend/schemas/fiscal-years'
import { and, eq, sql } from 'drizzle-orm'

// MARK: モデル変換

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

// MARK: クエリ型

export type BudgetWithCategoryType = {
  userId: UserId
  fiscalYearId: FiscalYearId
  categoryId: CategoryId
  budgetAmount: number
  categoryType: 'income' | 'expense' | 'saving'
}

// MARK: 検索

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

export const findBudgetsWithCategoryTypeByFiscalYearId =
  (db: DrizzleDatabase) =>
  async (
    userId: UserId,
    fiscalYearId: FiscalYearId,
  ): Promise<BudgetWithCategoryType[]> => {
    const results = await db
      .select({
        user_id: budgetsTable.user_id,
        fiscal_year_id: budgetsTable.fiscal_year_id,
        category_id: budgetsTable.category_id,
        budget_amount: budgetsTable.budget_amount,
        category_type: categoriesTable.type,
      })
      .from(budgetsTable)
      .innerJoin(
        categoriesTable,
        eq(budgetsTable.category_id, categoriesTable.id),
      )
      .where(
        and(
          eq(budgetsTable.user_id, userId),
          eq(budgetsTable.fiscal_year_id, fiscalYearId),
        ),
      )
    return results.map((r) => ({
      userId: r.user_id as UserId,
      fiscalYearId: r.fiscal_year_id as FiscalYearId,
      categoryId: r.category_id as CategoryId,
      budgetAmount: r.budget_amount,
      categoryType: r.category_type as 'income' | 'expense' | 'saving',
    }))
  }

// MARK: 保存

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
    await db
      .insert(budgetsTable)
      .values(
        budgets.map((b) => ({
          user_id: b.userId,
          fiscal_year_id: b.fiscalYearId,
          category_id: b.categoryId,
          budget_amount: b.budgetAmount,
        })),
      )
      .onConflictDoUpdate({
        target: [
          budgetsTable.user_id,
          budgetsTable.fiscal_year_id,
          budgetsTable.category_id,
        ],
        set: {
          budget_amount: sql`excluded.budget_amount`,
        },
      })
  }

export const saveFiscalYearAndBudgets =
  (db: DrizzleDatabase) =>
  async (params: {
    newFiscalYear: FiscalYear | undefined
    userId: UserId
    fiscalYearId: FiscalYearId
    budgets: Budget[]
  }): Promise<void> => {
    const stmts = [
      ...(params.newFiscalYear
        ? [
            db
              .insert(fiscalYearsTable)
              .values({
                id: params.newFiscalYear.id,
                user_id: params.newFiscalYear.userId,
                year: params.newFiscalYear.year,
                status: params.newFiscalYear.status,
              })
              .onConflictDoUpdate({
                target: fiscalYearsTable.id,
                set: { status: params.newFiscalYear.status },
              }),
          ]
        : []),
      db
        .delete(budgetsTable)
        .where(
          and(
            eq(budgetsTable.user_id, params.userId),
            eq(budgetsTable.fiscal_year_id, params.fiscalYearId),
          ),
        ),
      ...(params.budgets.length > 0
        ? [
            db
              .insert(budgetsTable)
              .values(
                params.budgets.map((b) => ({
                  user_id: b.userId,
                  fiscal_year_id: b.fiscalYearId,
                  category_id: b.categoryId,
                  budget_amount: b.budgetAmount,
                })),
              )
              .onConflictDoUpdate({
                target: [
                  budgetsTable.user_id,
                  budgetsTable.fiscal_year_id,
                  budgetsTable.category_id,
                ],
                set: { budget_amount: sql`excluded.budget_amount` },
              }),
          ]
        : []),
    ]
    await db.batch(
      stmts as [(typeof stmts)[number], ...(typeof stmts)[number][]],
    )
  }

// MARK: 削除

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
