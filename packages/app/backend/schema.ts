import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const postsTable = sqliteTable(
  'posts',
  {
    id: text().notNull(),
    user_id: text().notNull(),
    title: text().notNull(),
    content: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.id, table.user_id] })],
)
