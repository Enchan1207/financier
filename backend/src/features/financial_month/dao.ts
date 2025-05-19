import { z } from 'zod'

import type {
  FinancialMonth, FinancialMonthData, WorkdayValue,
} from '@/domains/financial_month'
import { FinancialMonthValueSchema, WorkdayValueSchema } from '@/domains/financial_month'
import { FinancialYearValueSchema } from '@/domains/financial_year'
import type { User } from '@/domains/user'
import type dayjs from '@/logic/dayjs'
import { condition, every } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

import { makeFinancialMonthEntity } from '../financial_year/dao'

export const FinancialMonthRecord = z.object({
  id: z.string(),
  user_id: z.string(),
  financial_year: FinancialYearValueSchema,
  month: FinancialMonthValueSchema,
  started_at: z.number(),
  ended_at: z.number(),
  workday: WorkdayValueSchema,
})
export type FinancialMonthRecord = z.infer<typeof FinancialMonthRecord>

export const getFinancialMonthByFinancialMonth = (db: D1Database):
(userId: string, financialMonth: FinancialMonthData) => Promise<FinancialMonth | undefined> =>
  async (userId, { financialYear, month }) => {
    const stmt = d1(db)
      .select(FinancialMonthRecord, 'financial_months')
      .where(every(
        condition('user_id', '==', userId),
        condition('financial_year', '==', financialYear),
        condition('month', '==', month),
      ))
      .build()

    const record = await stmt.first<FinancialMonthRecord>()
    const item = record ? makeFinancialMonthEntity(record) : undefined
    return item
  }

export const findFinancialMonthsByDate = (db: D1Database):
(userId: string, date: dayjs.Dayjs) => Promise<FinancialMonth | undefined> =>
  async (userId, date) => {
    const timestamp = date.valueOf()

    const stmt = d1(db)
      .select(FinancialMonthRecord, 'financial_months')
      .where(every(
        condition('user_id', '==', userId),
        condition('started_at', '<=', timestamp),
        condition('ended_at', '>=', timestamp),
      ))
      .build()

    const record = await stmt.first<FinancialMonthRecord>()
    const item = record ? makeFinancialMonthEntity(record) : undefined
    return item
  }

export const updateFinancialMonth = (db: D1Database):
(userId: User['id'], financialMonthId: FinancialMonth['id'], props: { workday: WorkdayValue }) => Promise<FinancialMonth | undefined> =>
  async (userId, financialMonthId, { workday }) => {
    const updateQueryBase = 'UPDATE financial_months SET workday=? WHERE id=? AND user_id=?'
    const updateQuery = db
      .prepare(updateQueryBase)
      .bind(workday, financialMonthId, userId)

    const getQuery = d1(db)
      .select(FinancialMonthRecord, 'financial_months')
      .where(condition('id', '==', financialMonthId))
      .build()

    const queries: D1PreparedStatement[] = [updateQuery, getQuery]
    const results = await db.batch<FinancialMonthRecord>(queries)

    const record = results.at(-1)?.results.at(0)

    return record ? makeFinancialMonthEntity(record) : undefined
  }
