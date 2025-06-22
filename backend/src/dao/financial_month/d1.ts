import { condition, every } from '@/logic/query_builder/condition_tree'
import { d1 } from '@/logic/query_builder/d1'

import type { FinancialMonthDao } from '.'
import type { FinancialMonthRecord } from './schema'
import { FinancialMonthRecordSchema } from './schema'

export const getMonthlyContext =
  (db: D1Database): FinancialMonthDao['getMonthlyContext'] =>
  async ({ userId, info: { financialYear, month } }) => {
    const stmt = d1(db)
      .select(FinancialMonthRecordSchema, 'financial_month_contexts')
      .where(
        every(
          condition('user_id', '==', userId),
          condition('financial_year', '==', financialYear),
          condition('month', '==', month),
        ),
      )
      .build()

    const record = await stmt.first<FinancialMonthRecord>()
    const item = record ? makeFinancialMonthEntity(record) : undefined
    return item
  }

export const findFinancialMonthCotextsByDate =
  (db: D1Database): FinancialMonthDao['findFinancialMonthCotextsByDate'] =>
  async ({ userId, date }) => {
    const timestamp = date.toTimestamp()

    const stmt = d1(db)
      .select(FinancialMonthRecordSchema, 'financial_month_contexts')
      .where(
        every(
          condition('user_id', '==', userId),
          condition('started_at', '<=', timestamp),
          condition('ended_at', '>=', timestamp),
        ),
      )
      .build()

    const record = await stmt.first<FinancialMonthRecord>()
    const item = record ? makeFinancialMonthEntity(record) : undefined
    return item
  }

export const updateMonthlyContext =
  (db: D1Database): FinancialMonthDao['updateMonthlyContext'] =>
  async ({ id, userId, workday }) => {
    const updateQuery = d1(db)
      .update(FinancialMonthRecordSchema, 'financial_month_contexts')
      .where(
        every(condition('id', '==', id), condition('user_id', '==', userId)),
      )
      .set({
        workday,
      })
      .build()

    const getQuery = d1(db)
      .select(FinancialMonthRecordSchema, 'financial_month_contexts')
      .where(condition('id', '==', id))
      .build()

    const queries: D1PreparedStatement[] = [updateQuery, getQuery]
    const results = await db.batch<FinancialMonthRecord>(queries)

    const record = results.at(-1)?.results.at(0)

    return record ? makeFinancialMonthEntity(record) : undefined
  }
