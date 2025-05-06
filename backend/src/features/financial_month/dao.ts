import type { FinancialMonth, FinancialMonthData } from '@/domains/financial_month'
import type dayjs from '@/logic/dayjs'
import { condition, every } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

import { FinancialMonthRecord, makeFinancialMonthEntity } from '../financial_year/dao'

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
