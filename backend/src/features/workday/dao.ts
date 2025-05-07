import { z } from 'zod'

import type { Workday } from '@/domains/workday'
import dayjs from '@/logic/dayjs'
import { condition } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

export const WorkdayRecord = z.object({
  user_id: z.string(),
  financial_month_id: z.string(),
  count: z.number(),
  updated_at: z.number(),
})

export type WorkdayRecord = z.infer<typeof WorkdayRecord>

const makeEntity = ({
  user_id, financial_month_id, count, updated_at,
}: WorkdayRecord): Workday => ({
  userId: user_id,
  financialMonthId: financial_month_id,
  count,
  updatedAt: dayjs(updated_at),
})

export const updateWorkday = (db: D1Database):
(props: Pick<Workday, 'userId' | 'financialMonthId' | 'count'>) => Promise<Workday | undefined> => async (props) => {
  const stmt = `
  UPDATE workdays SET
    count = ?1,
    updated_at = ?2
  WHERE
    user_id = ?3
    AND financial_month_id = ?4
  `

  const insertionQuery = db
    .prepare(stmt)
    .bind(
      props.count,
      dayjs().valueOf(),
      props.userId,
      props.financialMonthId,
    )

  const findQuery = d1(db)
    .select(WorkdayRecord, 'workdays')
    .where(condition('financial_month_id', '==', props.financialMonthId))
    .build()

  const results = await db.batch<Workday>([insertionQuery, findQuery])
  const updated = results.at(0)?.results.at(0)

  return updated
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
