import type { FinancialMonth } from '@/domains/financial_month'
import { getPeriodByFinancialMonth } from '@/domains/financial_month/logic'
import type { FinancialYear } from '@/domains/financial_year'

import type { FinancialMonthRecord } from '../financial_month/dao'

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

export const insertFinancialYear = (db: D1Database):
(item: FinancialYear) => Promise<FinancialYear> =>
  async (entity) => {
    const stmt = 'INSERT INTO financial_months VALUES (?1,?2,?3,?4,?5,?6)'
    const base = db.prepare(stmt)

    const monthRecords = entity.months.map(makeRecord)

    const preparedStatements = monthRecords.map(record => base.bind(
      record.id,
      record.user_id,
      record.financial_year,
      record.month,
      record.started_at,
      record.ended_at,
    ))

    await db.batch(preparedStatements)

    return entity
  }
