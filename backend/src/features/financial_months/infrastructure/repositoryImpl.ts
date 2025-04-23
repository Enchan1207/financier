import dayjs from '@/logic/dayjs'
import { condition, every } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

import type { FinancialMonth, Months } from '../domain/entity'
import type { FinancialMonthRepository } from '../domain/repository'
import { FinancialMonthRecord } from './entity'

const makeFinancialMonth = (entity: FinancialMonthRecord): FinancialMonth => {
  const {
    started_at, ended_at, user_id,
  } = entity

  return {
    id: entity.id,
    userId: user_id,
    financialYear: entity.financial_year,
    month: entity.month as Months,
    startedAt: dayjs(started_at),
    endedAt: dayjs(ended_at),
  }
}

const insertFinancialMonth = (db: D1Database): FinancialMonthRepository['insertFinancialMonth'] => async (item) => {
  const stmt = 'INSERT INTO financial_months VALUES (?1,?2,?3,?4,?5,?6)'

  await db.prepare(stmt).bind(
    item.id,
    item.userId,
    item.financialYear,
    item.month,
    item.startedAt.valueOf(),
    item.endedAt.valueOf(),
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

const findByFinancialYearAndMonth = (db: D1Database): FinancialMonthRepository['findByFinancialYearAndMonth'] => async (userId, financialYear, month) => {
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
    findByFinancialYearAndMonth: findByFinancialYearAndMonth(db),
    findByDate: findByDate(db),
  }
}
