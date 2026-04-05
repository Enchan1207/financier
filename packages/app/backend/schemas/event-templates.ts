import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { categoriesTable } from './categories'
import { usersTable } from './users'

export const eventTemplatesTable = sqliteTable('event_templates', {
  id: text().notNull().primaryKey(),
  user_id: text()
    .notNull()
    .references(() => usersTable.id),
  name: text().notNull(),
})

export const eventTemplateItemsTable = sqliteTable(
  'event_template_items',
  {
    event_template_id: text()
      .notNull()
      .references(() => eventTemplatesTable.id),
    category_id: text()
      .notNull()
      .references(() => categoriesTable.id),
    name: text().notNull(),
    amount: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.event_template_id, t.category_id] })],
)
