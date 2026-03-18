import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { usersTable } from './users'

export const fiscalYearsTable = sqliteTable('fiscal_years', {
  id: text().notNull().primaryKey(),
  user_id: text()
    .notNull()
    .references(() => usersTable.id),
  year: integer().notNull(),
  status: text().notNull(), // 'active' | 'closed'
})
