import type { Category, CategoryId } from '@backend/domains/category'
import type { UserId } from '@backend/domains/user'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { createCategoryModel } from '@backend/repositories/category'
import { categoriesTable } from '@backend/schemas/categories'
import { and, eq } from 'drizzle-orm'

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
  (userId: UserId) =>
  async (id: CategoryId): Promise<Category | undefined> => {
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
        status: category.status,
        icon: category.icon,
        color: category.color,
      })
      .onConflictDoUpdate({
        target: categoriesTable.id,
        set: {
          name: category.name,
          status: category.status,
          icon: category.icon,
          color: category.color,
        },
      })
  }

export const archiveCategory =
  (db: DrizzleDatabase) =>
  async (id: CategoryId): Promise<void> => {
    await db
      .update(categoriesTable)
      .set({ status: 'archived' })
      .where(eq(categoriesTable.id, id))
  }
