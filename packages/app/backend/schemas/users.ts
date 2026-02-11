import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/** Users テーブル定義 */
export const usersTable = sqliteTable(
  'users',
  {
    id: text().notNull(),
    idp_subject: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.id] })],
)
