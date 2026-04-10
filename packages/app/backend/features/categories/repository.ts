import type { Category, CategoryId } from '@backend/domains/category'
import type { UserId } from '@backend/domains/user'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { createCategoryModel } from '@backend/repositories/category'
import { categoriesTable } from '@backend/schemas/categories'
import { Result } from '@praha/byethrow'
import { and, DrizzleQueryError, eq, inArray } from 'drizzle-orm'

import {
  CategoryNotFoundException,
  CategoryRelationException,
} from './exceptions'

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

export const findCategoriesByIds =
  (db: DrizzleDatabase) =>
  async (
    ids: CategoryId[],
    userId: UserId,
  ): Promise<Map<CategoryId, Category>> => {
    if (ids.length === 0) return new Map()
    const results = await db
      .select()
      .from(categoriesTable)
      .where(
        and(
          inArray(categoriesTable.id, ids),
          eq(categoriesTable.user_id, userId),
        ),
      )
    return new Map(
      results.map((r) => [r.id as CategoryId, createCategoryModel(r)]),
    )
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

export const deleteCategory =
  (db: DrizzleDatabase) =>
  async (
    id: CategoryId,
    userId: UserId,
  ): Result.ResultAsync<
    Category,
    CategoryNotFoundException | CategoryRelationException
  > =>
    Result.pipe(
      Result.try({
        try: () =>
          db
            .delete(categoriesTable)
            .where(
              and(
                eq(categoriesTable.id, id),
                eq(categoriesTable.user_id, userId),
              ),
            )
            .returning(),
        catch: (e: unknown) => {
          if (!(e instanceof DrizzleQueryError)) {
            throw e
          }

          // NOTE: 外部キー制約により削除に失敗した場合のエラーメッセージは以下のとおり:
          // NOTE: `D1_ERROR: FOREIGN KEY constraint failed: SQLITE_CONSTRAINT`
          // NOTE: D1環境・Cloudflare環境でどのように変化するか読めないため、明らかに変わらないであろう部分のみ比較
          const rawErrorMessage = e.cause?.message
          if (rawErrorMessage?.includes('FOREIGN KEY constraint failed')) {
            return new CategoryRelationException(
              'カテゴリと関連するエンティティが残っているため削除できません',
            )
          }

          throw e
        },
      }),
      Result.andThen((rows) => {
        const deleted = rows.at(0)

        if (deleted === undefined) {
          return Result.fail(
            new CategoryNotFoundException(
              '削除しようとしたカテゴリが見つかりませんでした。すでに削除されている可能性があります',
            ),
          )
        }

        return Result.succeed(createCategoryModel(deleted))
      }),
    )
