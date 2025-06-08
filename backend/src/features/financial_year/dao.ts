import type { FinancialMonth } from '@/domains/financial_month'
import { getPeriodByFinancialMonth } from '@/domains/financial_month/logic'
import type {
  FinancialYear,
  FinancialYearValue,
} from '@/domains/financial_year'
import type { User } from '@/domains/user'
import { condition, every } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

import { FinancialMonthRecord } from '../financial_month/dao'

const makeFinancialMonthRecord = ({
  id,
  userId,
  financialYear,
  month,
  workday,
}: FinancialMonth): FinancialMonthRecord => {
  const { start, end } = getPeriodByFinancialMonth({
    financialYear,
    month,
    workday,
  })

  return {
    id,
    user_id: userId,
    financial_year: financialYear,
    month,
    started_at: start.valueOf(),
    ended_at: end.valueOf(),
    workday,
  }
}

export const makeFinancialMonthEntity = ({
  id,
  user_id,
  financial_year,
  month,
  workday,
}: FinancialMonthRecord): FinancialMonth => ({
  id,
  userId: user_id,
  financialYear: financial_year,
  month: month,
  workday,
})

export const insertFinancialYear =
  (db: D1Database): ((item: FinancialYear) => Promise<FinancialYear>) =>
  async (entity) => {
    const monthRecords = entity.months.map(makeFinancialMonthRecord)

    const stmt = 'INSERT INTO financial_months VALUES (?1,?2,?3,?4,?5,?6, ?7)'
    const base = db.prepare(stmt)

    const queries: D1PreparedStatement[] = monthRecords.map((record) =>
      base.bind(
        record.id,
        record.user_id,
        record.financial_year,
        record.month,
        record.started_at,
        record.ended_at,
        record.workday,
      ),
    )

    await db.batch(queries)

    return entity
  }

export const listFinancialYears =
  (
    db: D1Database,
  ): ((props: {
    userId: User['id']
    order?: 'asc' | 'desc'
  }) => Promise<FinancialYearValue[]>) =>
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

    const financialYears = result.results.map(
      ({ financial_year }) => financial_year,
    )
    return financialYears
  }

export const getFinancialYear =
  (
    db: D1Database,
  ): ((props: {
    userId: User['id']
    financialYear: FinancialYearValue
  }) => Promise<FinancialYear | undefined>) =>
  async ({ userId, financialYear }) => {
    const stmt = d1(db)
      .select(FinancialMonthRecord, 'financial_months')
      .where(
        every(
          condition('user_id', '==', userId),
          condition('financial_year', '==', financialYear),
        ),
      )
      .build()

    const { results } = await stmt.run<FinancialMonthRecord>()
    const months = results.map(makeFinancialMonthEntity)

    if (months.length === 0) {
      return undefined
    }

    return {
      year: financialYear,
      months,
    }
  }
