import type { FinancialMonthContext } from '@/domains/financial_month_context'
import { getPeriodByFinancialMonth } from '@/domains/financial_month_context/logic'
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
  info,
  workday,
  standardIncomeTableId,
}: FinancialMonthContext): FinancialMonthRecord => {
  const { start, end } = getPeriodByFinancialMonth(info)

  return {
    id,
    user_id: userId,
    financial_year: info.financialYear,
    month: info.month,
    started_at: start.valueOf(),
    ended_at: end.valueOf(),
    workday,
    standard_income_table_id: standardIncomeTableId,
  }
}

export const makeFinancialMonthEntity = ({
  id,
  user_id,
  financial_year,
  month,
  workday,
  standard_income_table_id,
}: FinancialMonthRecord): FinancialMonthContext => ({
  id,
  userId: user_id,
  info: {
    financialYear: financial_year,
    month: month,
  },
  workday,
  standardIncomeTableId: standard_income_table_id,
})

export const insertFinancialYear =
  (db: D1Database): ((item: FinancialYear) => Promise<FinancialYear>) =>
  async (entity) => {
    const monthRecords = entity.months.map(makeFinancialMonthRecord)

    const base = d1(db).insert(FinancialMonthRecord, 'financial_month_contexts')
    const queries = monthRecords.map((record) => base.values(record).build())

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
        financial_month_contexts
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
      .select(FinancialMonthRecord, 'financial_month_contexts')
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
