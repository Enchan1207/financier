import { z } from 'zod'

import type { Workday } from '@/domain/workday'
import dayjs from '@/logic/dayjs'
import { condition } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

export const WorkdayRecord = z.object({
  id: z.string(),
  user_id: z.string(),
  financial_month_id: z.string(),
  count: z.number(),
  updated_at: z.number(),
})

type WorkdayRecord = z.infer<typeof WorkdayRecord>

const makeEntity = ({
  id, user_id, financial_month_id, count, updated_at,
}: WorkdayRecord): Workday => ({
  id,
  userId: user_id,
  financialMonthId: financial_month_id,
  count,
  updatedAt: dayjs(updated_at),
})

const makeRecord = ({
  id, userId, financialMonthId, count, updatedAt,
}: Workday): WorkdayRecord => ({
  id,
  user_id: userId,
  financial_month_id: financialMonthId,
  count,
  updated_at: updatedAt.valueOf(),
})

export const saveWorkday = (db: D1Database): (entity: Workday) => Promise<Workday> => async (entity) => {
  const stmt = `INSERT INTO workdays 
  VALUES (?1,?2,?3,?4,?5)
  ON CONFLICT (id) DO UPDATE SET
      count = ?4,
      updated_at = ?5
  `

  const record = makeRecord(entity)

  await db.prepare(stmt).bind(
    record.id,
    record.user_id,
    record.financial_month_id,
    record.count,
    record.updated_at,
  ).run()

  return entity
}

export const findWorkdayByFinancialMonthId = (db: D1Database): (financialMonthId: string) => Promise<Workday | undefined> => async (financialMonthId) => {
  const stmt = d1(db)
    .select(WorkdayRecord, 'workdays')
    .where(condition('financial_month_id', '==', financialMonthId))
    .build()

  const record = await stmt.first<WorkdayRecord>()
  const item = record ? makeEntity(record) : undefined
  return item
}
