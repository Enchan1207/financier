import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { usersTable } from './users'

export const eventTemplatesTable = sqliteTable('event_templates', {
  id: text().notNull().primaryKey(),
  user_id: text()
    .notNull()
    .references(() => usersTable.id),
  name: text().notNull(),
  /** JSON: TemplateTransaction[] */
  default_transactions: text().notNull(),
})
