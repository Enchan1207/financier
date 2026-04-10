import type { EventTemplateId } from '@backend/domains/event-template'
import type { UserId } from '@backend/domains/user'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { categoriesTable } from '@backend/schemas/categories'
import {
  eventTemplateItemsTable,
  eventTemplatesTable,
} from '@backend/schemas/event-templates'
import { and, eq } from 'drizzle-orm'

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

const resolveCategoryType = (type: string): 'income' | 'expense' =>
  type === 'income' ? 'income' : 'expense'

export const findEventTemplateSummaries =
  (db: DrizzleDatabase) =>
  async (userId: UserId): Promise<EventTemplateSummaryRow[]> => {
    const rows = await db
      .select({
        id: eventTemplatesTable.id,
        name: eventTemplatesTable.name,
        item_category_id: eventTemplateItemsTable.category_id,
        item_name: eventTemplateItemsTable.name,
        item_amount: eventTemplateItemsTable.amount,
        category_name: categoriesTable.name,
        category_type: categoriesTable.type,
      })
      .from(eventTemplatesTable)
      .leftJoin(
        eventTemplateItemsTable,
        eq(eventTemplatesTable.id, eventTemplateItemsTable.event_template_id),
      )
      .leftJoin(
        categoriesTable,
        eq(eventTemplateItemsTable.category_id, categoriesTable.id),
      )
      .where(eq(eventTemplatesTable.user_id, userId))

    const map = new Map<string, EventTemplateSummaryRow>()
    for (const row of rows) {
      if (!map.has(row.id)) {
        map.set(row.id, { id: row.id, name: row.name, items: [] })
      }
      const entry = map.get(row.id)
      if (
        entry !== undefined &&
        row.item_category_id !== null &&
        row.item_name !== null &&
        row.item_amount !== null &&
        row.category_name !== null &&
        row.category_type !== null
      ) {
        entry.items.push({
          categoryName: row.category_name,
          name: row.item_name,
          defaultAmount: row.item_amount,
          type: resolveCategoryType(row.category_type),
        })
      }
    }
    return [...map.values()]
  }

export const findEventTemplateDetail =
  (db: DrizzleDatabase) =>
  async (
    id: EventTemplateId,
    userId: UserId,
  ): Promise<EventTemplateDetailRow | undefined> => {
    const rows = await db
      .select({
        id: eventTemplatesTable.id,
        name: eventTemplatesTable.name,
        item_category_id: eventTemplateItemsTable.category_id,
        item_name: eventTemplateItemsTable.name,
        item_amount: eventTemplateItemsTable.amount,
        category_name: categoriesTable.name,
        category_type: categoriesTable.type,
      })
      .from(eventTemplatesTable)
      .leftJoin(
        eventTemplateItemsTable,
        eq(eventTemplatesTable.id, eventTemplateItemsTable.event_template_id),
      )
      .leftJoin(
        categoriesTable,
        eq(eventTemplateItemsTable.category_id, categoriesTable.id),
      )
      .where(
        and(
          eq(eventTemplatesTable.id, id),
          eq(eventTemplatesTable.user_id, userId),
        ),
      )

    if (rows.length === 0) {
      return undefined
    }

    const first = rows[0]
    if (first === undefined) {
      return undefined
    }
    const items: EventTemplateDetailItem[] = []
    for (const row of rows) {
      if (
        row.item_category_id !== null &&
        row.item_name !== null &&
        row.item_amount !== null &&
        row.category_name !== null &&
        row.category_type !== null
      ) {
        items.push({
          categoryId: row.item_category_id,
          categoryName: row.category_name,
          name: row.item_name,
          defaultAmount: row.item_amount,
          type: resolveCategoryType(row.category_type),
        })
      }
    }

    return { id: first.id, name: first.name, items }
  }
