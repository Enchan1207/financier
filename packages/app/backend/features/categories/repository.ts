import type { Category, CategoryId } from '@backend/domains/category'
import type { UserId } from '@backend/domains/user'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { createCategoryModel } from '@backend/repositories/category'
import { budgetsTable } from '@backend/schemas/budgets'
import { categoriesTable } from '@backend/schemas/categories'
import { savingDefinitionsTable } from '@backend/schemas/saving-definitions'
import { transactionsTable } from '@backend/schemas/transactions'
import { and, count, eq } from 'drizzle-orm'

import type { CategoryReferences } from './exceptions'

export const findCategories =
  (db: DrizzleDatabase) =>
  async (userId: UserId): Promise<Category[]> => {
    const results = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.user_id, userId))
    return results.map(createCategoryModel)
  }

export const findCategoryById =
  (db: DrizzleDatabase) =>
  async (id: CategoryId, userId: UserId): Promise<Category | undefined> => {
    const results = await db
      .select()
      .from(categoriesTable)
      .where(
        and(eq(categoriesTable.id, id), eq(categoriesTable.user_id, userId)),
      )

    const row = results[0]
    return row ? createCategoryModel(row) : undefined
  }

export const saveCategory =
  (db: DrizzleDatabase) =>
  async (category: Category): Promise<void> => {
    await db
      .insert(categoriesTable)
      .values({
        id: category.id,
        user_id: category.userId,
        type: category.type,
        name: category.name,
        icon: category.icon,
        color: category.color,
      })
      .onConflictDoUpdate({
        target: categoriesTable.id,
        set: {
          name: category.name,
          icon: category.icon,
          color: category.color,
        },
      })
  }

export const countCategoryReferences =
  (db: DrizzleDatabase) =>
  async (id: CategoryId): Promise<CategoryReferences> => {
    const [txResult, budgetResult, savingResult] = await Promise.all([
      db
        .select({ count: count() })
        .from(transactionsTable)
        .where(eq(transactionsTable.category_id, id)),
      db
        .select({ count: count() })
        .from(budgetsTable)
        .where(eq(budgetsTable.category_id, id)),
      db
        .select({ count: count() })
        .from(savingDefinitionsTable)
        .where(eq(savingDefinitionsTable.category_id, id)),
    ])

    return {
      transactions: (txResult[0]?.count ?? 0) > 0,
      budgets: (budgetResult[0]?.count ?? 0) > 0,
      savingDefinitions: (savingResult[0]?.count ?? 0) > 0,
    }
  }

export const deleteCategory =
  (db: DrizzleDatabase) =>
  async (id: CategoryId): Promise<void> => {
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id))
  }
