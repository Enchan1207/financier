import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { categoriesTable } from './categories'
import { fiscalYearsTable } from './fiscal-years'
import { usersTable } from './users'

export const budgetsTable = sqliteTable(
  'budgets',
  {
    user_id: text()
      .notNull()
      .references(() => usersTable.id),
    fiscal_year_id: text()
      .notNull()
      .references(() => fiscalYearsTable.id),
    category_id: text()
      .notNull()
      .references(() => categoriesTable.id),
    budget_amount: integer().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.user_id, t.fiscal_year_id, t.category_id] }),
  ],
)
