import { condition, every } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

import type { FinancialMonth } from '../domain/entity'
import type { FinancialMonthRepository } from '../domain/repository'
import type { Months } from '../domain/valueObject'
import { getPeriodByFinancialMonth } from '../domain/valueObject'
import { FinancialMonthRecord } from './entity'

const makeFinancialMonth = (entity: FinancialMonthRecord): FinancialMonth => {
  return {
    id: entity.id,
    userId: entity.user_id,
    financialYear: entity.financial_year,
    month: entity.month as Months,
  }
}

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

const insertFinancialMonth = (db: D1Database): FinancialMonthRepository['insertFinancialMonth'] => async (item) => {
  const stmt = 'INSERT INTO financial_months VALUES (?1,?2,?3,?4,?5,?6)'

  const record = makeFinancialMonthRecord(item)

  await db.prepare(stmt).bind(
    record.id,
    record.user_id,
    record.financial_year,
    record.month,
    record.started_at,
    record.ended_at,
  ).run()

  return item
}

const findByFinancialYear = (db: D1Database): FinancialMonthRepository['findByFinancialYear'] => async (userId, financialYear) => {
  const stmt = d1(db)
    .select(FinancialMonthRecord, 'financial_months')
    .where(every(
      condition('user_id', '==', userId),
      condition('financial_year', '==', financialYear),
    ))
    .build()

  const { results } = await stmt.run<FinancialMonthRecord>()
  const items = results.map(makeFinancialMonth)

  return items
}

const findByFinancialMonth = (db: D1Database): FinancialMonthRepository['findByFinancialMonth'] => async (userId, { financialYear, month }) => {
  const stmt = d1(db)
    .select(FinancialMonthRecord, 'financial_months')
    .where(every(
      condition('user_id', '==', userId),
      condition('financial_year', '==', financialYear),
      condition('month', '==', month),
    ))
    .build()

  const record = await stmt.first<FinancialMonthRecord>()
  const item = record ? makeFinancialMonth(record) : undefined
  return item
}

const findByDate = (db: D1Database): FinancialMonthRepository['findByDate'] => async (userId, date) => {
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
  const item = record ? makeFinancialMonth(record) : undefined
  return item
}

export const useFinancialMonthRepositoryD1 = (db: D1Database): FinancialMonthRepository => {
  return {
    insertFinancialMonth: insertFinancialMonth(db),
    findByFinancialYear: findByFinancialYear(db),
    findByFinancialMonth: findByFinancialMonth(db),
    findByDate: findByDate(db),
  }
}
