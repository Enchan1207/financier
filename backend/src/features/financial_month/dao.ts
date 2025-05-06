import { z } from 'zod'

import type {
  FinancialMonth, FinancialMonthData, Months,
} from '@/domains/financial_month'
import type dayjs from '@/logic/dayjs'
import { condition, every } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

const FinancialMonthRecord = z.object({
  id: z.string(),
  user_id: z.string(),
  financial_year: z.number(),
  month: z.number(),
  started_at: z.number(),
  ended_at: z.number(),
})

export type FinancialMonthRecord = z.infer<typeof FinancialMonthRecord>

const makeEntity = ({
  id, user_id, financial_year, month,
}: FinancialMonthRecord): FinancialMonth => ({
  id,
  userId: user_id,
  financialYear: financial_year,
  month: month as Months,
})

/**
 * @deprecated この関数、必要か?
 */
export const findFinancialMonthsByYear = (db: D1Database):
(userId: string, financialYear: number) => Promise<FinancialMonth[]> =>
  async (userId, financialYear) => {
    const stmt = d1(db)
      .select(FinancialMonthRecord, 'financial_months')
      .where(every(
        condition('user_id', '==', userId),
        condition('financial_year', '==', financialYear),
      ))
      .build()

    const { results } = await stmt.run<FinancialMonthRecord>()
    const items = results.map(makeEntity)

    return items
  }

/**
 * @deprecated この関数、必要か?
 */
export const findFinancialMonthsByMonth = (db: D1Database):
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
    const item = record ? makeEntity(record) : undefined
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
    const item = record ? makeEntity(record) : undefined
    return item
  }
