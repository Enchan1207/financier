import { z } from 'zod'

import { FinancialYearValueSchema } from '@/domains/financial_year'
import type {
  FinancialMonthInfo,
  MonthlyContext,
  WorkdayValue,
} from '@/domains/monthly_context'
import { MonthsSchema, WorkdayValueSchema } from '@/domains/monthly_context'
import type { User } from '@/domains/user'
import type dayjs from '@/logic/dayjs'
import { condition, every } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

import { makeFinancialMonthEntity } from '../financial_year/dao'

export const FinancialMonthRecord = z.object({
  id: z.string(),
  user_id: z.string(),
  financial_year: FinancialYearValueSchema,
  month: MonthsSchema,
  started_at: z.number(),
  ended_at: z.number(),
  workday: WorkdayValueSchema,
  standard_income_table_id: z.string(),
})
export type FinancialMonthRecord = z.infer<typeof FinancialMonthRecord>

export const getMonthlyContext =
  (
    db: D1Database,
  ): ((props: {
    userId: string
    info: FinancialMonthInfo
  }) => Promise<MonthlyContext | undefined>) =>
  async ({ userId, info: { financialYear, month } }) => {
    const stmt = d1(db)
      .select(FinancialMonthRecord, 'financial_month_contexts')
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
  (
    db: D1Database,
  ): ((props: {
    userId: string
    date: dayjs.Dayjs
  }) => Promise<MonthlyContext | undefined>) =>
  async ({ userId, date }) => {
    const timestamp = date.valueOf()

    const stmt = d1(db)
      .select(FinancialMonthRecord, 'financial_month_contexts')
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
  (
    db: D1Database,
  ): ((props: {
    id: MonthlyContext['id']
    userId: User['id']
    workday: WorkdayValue
  }) => Promise<MonthlyContext | undefined>) =>
  async ({ id, userId, workday }) => {
    const updateQuery = d1(db)
      .update(FinancialMonthRecord, 'financial_month_contexts')
      .where(
        every(condition('id', '==', id), condition('user_id', '==', userId)),
      )
      .set({
        workday,
      })
      .build()

    const getQuery = d1(db)
      .select(FinancialMonthRecord, 'financial_month_contexts')
      .where(condition('id', '==', id))
      .build()

    const queries: D1PreparedStatement[] = [updateQuery, getQuery]
    const results = await db.batch<FinancialMonthRecord>(queries)

    const record = results.at(-1)?.results.at(0)

    return record ? makeFinancialMonthEntity(record) : undefined
  }
