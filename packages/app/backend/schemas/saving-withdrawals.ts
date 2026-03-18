import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { savingDefinitionsTable } from './saving-definitions'
import { usersTable } from './users'

export const savingWithdrawalsTable = sqliteTable('saving_withdrawals', {
  id: text().notNull().primaryKey(),
  user_id: text()
    .notNull()
    .references(() => usersTable.id),
  saving_definition_id: text()
    .notNull()
    .references(() => savingDefinitionsTable.id),
  amount: integer().notNull(),
  withdrawal_date: text().notNull(), // YYYY-MM-DD
  memo: text(),
  created_at: text().notNull(),
})
