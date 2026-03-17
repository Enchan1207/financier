import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { categoriesTable } from './categories'
import { usersTable } from './users'

export const transactionsTable = sqliteTable('transactions', {
  id: text().notNull().primaryKey(),
  user_id: text()
    .notNull()
    .references(() => usersTable.id),
  type: text().notNull(), // 'income' | 'expense'
  amount: integer().notNull(),
  category_id: text()
    .notNull()
    .references(() => categoriesTable.id),
  event_id: text(),
  name: text().notNull(),
  transaction_date: text().notNull(), // YYYY-MM-DD
  created_at: text().notNull(),
})
