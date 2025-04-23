import dayjs from '@/logic/dayjs'
import { condition } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

import type { Workday } from '../domain/entity'
import type { WorkdayRepository } from '../domain/repository'
import { WorkdayRecord } from './entity'

const makeWorkday = (record: WorkdayRecord): Workday => {
  return {
    id: record.id,
    userId: record.user_id,
    financialMonthId: record.financial_month_id,
    count: record.count,
    updatedAt: dayjs(record.updated_at),
  }
}

const saveWorkday = (db: D1Database): WorkdayRepository['saveWorkday'] => async (item) => {
  const stmt = `INSERT INTO workdays 
  VALUES (?1,?2,?3,?4,?5)
  ON CONFLICT (id) DO UPDATE SET
      count = ?4,
      updated_at = ?5
  `

  await db.prepare(stmt).bind(
    item.id,
    item.userId,
    item.financialMonthId,
    item.count,
    item.updatedAt.valueOf(),
  ).run()

  return item
}

const findByFinancialMonthId = (db: D1Database): WorkdayRepository['findByFinancialMonthId'] => async (financialMonthId) => {
  const stmt = d1(db)
    .select(WorkdayRecord, 'workdays')
    .where(condition('financial_month_id', '==', financialMonthId))
    .build()

  const record = await stmt.first<WorkdayRecord>()
  const item = record ? makeWorkday(record) : undefined
  return item
}

export const useWorkdayRepositoryD1 = (db: D1Database): WorkdayRepository => {
  return {
    saveWorkday: saveWorkday(db),
    findByFinancialMonthId: findByFinancialMonthId(db),
  }
}
