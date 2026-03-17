import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { usersTable } from './users'

export const categoriesTable = sqliteTable('categories', {
  id: text().notNull().primaryKey(),
  user_id: text()
    .notNull()
    .references(() => usersTable.id),
  type: text().notNull(), // 'income' | 'expense' | 'saving'
  name: text().notNull(),
  status: text().notNull(), // 'active' | 'archived'
  icon: text().notNull(),
  color: text().notNull(),
})
