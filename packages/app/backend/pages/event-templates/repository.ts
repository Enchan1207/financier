import type {
  EventTemplateId,
  TemplateTransaction,
} from '@backend/domains/event-template'
import type { UserId } from '@backend/domains/user'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { categoriesTable } from '@backend/schemas/categories'
import { eventTemplatesTable } from '@backend/schemas/event-templates'
import { eq, inArray } from 'drizzle-orm'

export type EventTemplateSummaryItem = {
  categoryName: string
  name: string
  defaultAmount: number
  type: 'income' | 'expense'
}

export type EventTemplateSummaryRow = {
  id: string
  name: string
  items: EventTemplateSummaryItem[]
}

export type EventTemplateDetailItem = {
  categoryId: string
  categoryName: string
  name: string
  defaultAmount: number
  type: 'income' | 'expense'
}

export type EventTemplateDetailRow = {
  id: string
  name: string
  items: EventTemplateDetailItem[]
}

type CategoryRow = {
  id: string
  name: string
  type: string
}

const buildCategoryMap = (
  categories: CategoryRow[],
): Map<string, CategoryRow> => {
  const map = new Map<string, CategoryRow>()
  for (const cat of categories) {
    map.set(cat.id, cat)
  }
  return map
}

const resolveCategoryType = (type: string): 'income' | 'expense' =>
  type === 'income' ? 'income' : 'expense'

export const findEventTemplateSummaries =
  (db: DrizzleDatabase) =>
  async (userId: UserId): Promise<EventTemplateSummaryRow[]> => {
    const templateRows = await db
      .select()
      .from(eventTemplatesTable)
      .where(eq(eventTemplatesTable.user_id, userId))

    if (templateRows.length === 0) {
      return []
    }

    const transactionsByTemplateId = new Map(
      templateRows.map((row) => [
        row.id,
        JSON.parse(row.default_transactions) as TemplateTransaction[],
      ]),
    )

    const categoryIds = [
      ...new Set(
        [...transactionsByTemplateId.values()].flatMap((transactions) =>
          transactions.map((tx) => tx.categoryId),
        ),
      ),
    ]

    const categoryRows =
      categoryIds.length > 0
        ? await db
            .select({
              id: categoriesTable.id,
              name: categoriesTable.name,
              type: categoriesTable.type,
            })
            .from(categoriesTable)
            .where(inArray(categoriesTable.id, categoryIds))
        : []

    const categoryMap = buildCategoryMap(categoryRows)

    return templateRows.map((row) => ({
      id: row.id,
      name: row.name,
      items: (transactionsByTemplateId.get(row.id) ?? []).map((tx) => {
        const cat = categoryMap.get(tx.categoryId)
        return {
          categoryName: cat?.name ?? tx.categoryId,
          name: tx.name,
          defaultAmount: tx.amount,
          type: resolveCategoryType(cat?.type ?? 'expense'),
        }
      }),
    }))
  }

export const findEventTemplateDetail =
  (db: DrizzleDatabase) =>
  async (
    id: EventTemplateId,
    userId: UserId,
  ): Promise<EventTemplateDetailRow | undefined> => {
    const results = await db
      .select()
      .from(eventTemplatesTable)
      .where(eq(eventTemplatesTable.id, id))

    const row = results[0]
    if (!row || row.user_id !== userId) {
      return undefined
    }

    const transactions = JSON.parse(
      row.default_transactions,
    ) as TemplateTransaction[]

    const categoryIds = [...new Set(transactions.map((tx) => tx.categoryId))]

    const categoryRows =
      categoryIds.length > 0
        ? await db
            .select({
              id: categoriesTable.id,
              name: categoriesTable.name,
              type: categoriesTable.type,
            })
            .from(categoriesTable)
            .where(inArray(categoriesTable.id, categoryIds))
        : []

    const categoryMap = buildCategoryMap(categoryRows)

    return {
      id: row.id,
      name: row.name,
      items: transactions.map((tx) => {
        const cat = categoryMap.get(tx.categoryId)
        return {
          categoryId: tx.categoryId,
          categoryName: cat?.name ?? tx.categoryId,
          name: tx.name,
          defaultAmount: tx.amount,
          type: resolveCategoryType(cat?.type ?? 'expense'),
        }
      }),
    }
  }
