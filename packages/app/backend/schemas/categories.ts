import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const categoriesTable = sqliteTable('categories', {
  id: text().notNull().primaryKey(),
  type: text().notNull(), // 'income' | 'expense' | 'saving'
  name: text().notNull(),
  status: text().notNull(), // 'active' | 'archived'
  icon: text().notNull(),
  color: text().notNull(),
})
