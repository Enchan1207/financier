import type { Category, CategoryId } from '@backend/domains/category'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { createCategoryModel } from '@backend/repositories/category'
import { categoriesTable } from '@backend/schemas/categories'
import { eq } from 'drizzle-orm'

export const findCategories =
  (db: DrizzleDatabase) => async (): Promise<Category[]> => {
    const results = await db.select().from(categoriesTable)
    return results.map(createCategoryModel)
  }

export const findCategoryById =
  (db: DrizzleDatabase) =>
  async (id: CategoryId): Promise<Category | undefined> => {
    const results = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, id))

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
