import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { categoriesTable } from './categories'
import { usersTable } from './users'

export const savingDefinitionsTable = sqliteTable('saving_definitions', {
  id: text().notNull().primaryKey(),
  user_id: text()
    .notNull()
    .references(() => usersTable.id),
  type: text().notNull(), // 'goal' | 'free'
  category_id: text()
    .notNull()
    .references(() => categoriesTable.id),
  /** 目標型のみ。null の場合は自由型 */
  target_amount: integer(),
  /** 目標型のみ。YYYY-MM-DD。null の場合は期限なし */
  deadline: text(),
})
