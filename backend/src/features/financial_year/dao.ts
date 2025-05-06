import type { FinancialMonth } from '@/domains/financial_month'
import { getPeriodByFinancialMonth } from '@/domains/financial_month/logic'
import type { FinancialYear, FinancialYearValue } from '@/domains/financial_year'
import type { User } from '@/domains/user'
import type { Workday } from '@/domains/workday'
import { createWorkday } from '@/domains/workday/logic'

import type { FinancialMonthRecord } from '../financial_month/dao'
import type { WorkdayRecord } from '../workday/dao'

const makeFinancialMonthRecord = ({
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

const makeWorkdayRecord = ({
  userId, financialMonthId, count, updatedAt,
}: Workday): WorkdayRecord => ({
  user_id: userId,
  financial_month_id: financialMonthId,
  count,
  updated_at: updatedAt.valueOf(),
})

const buildFinancialMonthInsertionQuery = (db: D1Database):
(entity: FinancialYear) => D1PreparedStatement[] => (entity) => {
  const monthRecords = entity.months.map(makeFinancialMonthRecord)

  const stmt = 'INSERT INTO financial_months VALUES (?1,?2,?3,?4,?5,?6)'
  const base = db.prepare(stmt)

  return monthRecords.map(record => base.bind(
    record.id,
    record.user_id,
    record.financial_year,
    record.month,
    record.started_at,
    record.ended_at,
  ))
}

const buildWorkdayInsertionQuery = (db: D1Database):
(entity: FinancialYear) => D1PreparedStatement[] => (entity) => {
  const workdayRecords = entity.months.map(month => createWorkday({
    userId: month.userId,
    financialMonth: month,
    count: 20, // NOTE: 本来はカレンダーライブラリ等を使うべき
  })).map(makeWorkdayRecord)

  const stmt = 'INSERT INTO workdays VALUES (?1,?2,?3,?4)'
  const base = db.prepare(stmt)

  return workdayRecords.map(record => base.bind(
    record.user_id,
    record.financial_month_id,
    record.count,
    record.updated_at,
  ))
}

export const insertFinancialYear = (db: D1Database):
(item: FinancialYear) => Promise<FinancialYear> =>
  async (entity) => {
    const queries: D1PreparedStatement[] = [
      ...buildFinancialMonthInsertionQuery(db)(entity),
      ...buildWorkdayInsertionQuery(db)(entity),
    ]

    await db.batch(queries)

    return entity
  }

export const listFinancialYears = (db: D1Database):
(props: {
  userId: User['id']
  order?: 'asc' | 'desc'
}) => Promise<FinancialYearValue[]> =>
  async (props) => {
    const order = props.order ?? 'asc'
    const stmt = `
    SELECT DISTINCT
        financial_year
    FROM
        financial_months
    WHERE
        user_id = ?
    ORDER BY
        financial_year ${order}
    `

    const result = await db
      .prepare(stmt)
      .bind(props.userId)
      .all<{ financial_year: FinancialYearValue }>()

    const financialYears = result.results.map(({ financial_year }) => financial_year)
    return financialYears
  }
