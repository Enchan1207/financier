import { z } from 'zod'

import type {
  FinancialMonth, FinancialMonthData, Months,
} from '@/domains/financial_month'
import { getPeriodByFinancialMonth } from '@/domains/financial_month/logic'
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

type FinancialMonthRecord = z.infer<typeof FinancialMonthRecord>

const makeRecord = ({
  id, userId, financialYear, month,
}: FinancialMonth): FinancialMonthRecord => {
  const { start, end } = getPeriodByFinancialMonth({
    financialYear,
    month,
  })

  return {
    id,
    user_id: userId,
    financial_year: financialYear,
    month,
    started_at: start.valueOf(),
    ended_at: end.valueOf(),
  }
}

const makeEntity = ({
  id, user_id, financial_year, month,
}: FinancialMonthRecord): FinancialMonth => ({
  id,
  userId: user_id,
  financialYear: financial_year,
  month: month as Months,
})

// TODO: ビジネスロジック上12件単位で突っ込むのが当たり前なので、そうしたい
export const insertFinancialMonth = (db: D1Database):
(item: FinancialMonth) => Promise<FinancialMonth> =>
  async (entity) => {
    const stmt = 'INSERT INTO financial_months VALUES (?1,?2,?3,?4,?5,?6)'

    const record = makeRecord(entity)

    await db.prepare(stmt).bind(
      record.id,
      record.user_id,
      record.financial_year,
      record.month,
      record.started_at,
      record.ended_at,
    ).run()

    return entity
  }

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
