import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { usersTable } from './users'

export const eventsTable = sqliteTable('events', {
  id: text().notNull().primaryKey(),
  user_id: text()
    .notNull()
    .references(() => usersTable.id),
  name: text().notNull(),
  occurred_on: text().notNull(), // YYYY-MM-DD
})
