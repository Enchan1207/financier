import type {
  Category,
  CategoryColor,
  CategoryIcon,
  CategoryId,
} from '@backend/domains/category'
import type { categoriesTable } from '@backend/schemas/categories'
import type { InferSelectModel } from 'drizzle-orm'

type CategoryRecord = InferSelectModel<typeof categoriesTable>

export const createCategoryModel = (record: CategoryRecord): Category => {
  const base = {
    id: record.id as CategoryId,
    name: record.name,
    status: record.status as Category['status'],
    icon: record.icon as CategoryIcon,
    color: record.color as CategoryColor,
  }

  if (record.type === 'income') {
    return { ...base, type: 'income' }
  }

  if (record.type === 'saving') {
    return { ...base, type: 'saving' }
  }

  return { ...base, type: 'expense' }
}
