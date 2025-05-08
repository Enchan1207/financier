import { z } from 'zod'

import type { FinancialMonth } from '@/domains/financial_month'
import type { User } from '@/domains/user'
import type { Workday } from '@/domains/workday'
import type { WorkdayValue } from '@/domains/workday/logic'
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
  count: count as WorkdayValue,
  updatedAt: dayjs(updated_at),
})

const buildWorkdayUpdateQuery = (db: D1Database):
(props: {
  count: WorkdayValue
  updatedAt: dayjs.Dayjs
  userId: User['id']
  financialMonthId: FinancialMonth['id']
}) => D1PreparedStatement => (props) => {
  const stmt = `
  UPDATE workdays SET
    count = ?1,
    updated_at = ?2
  WHERE
    user_id = ?3
    AND financial_month_id = ?4
  `

  return db
    .prepare(stmt)
    .bind(
      props.count,
      props.updatedAt.valueOf(),
      props.userId,
      props.financialMonthId,
    )
}

const buildIncomeRecordUpdateQuery = (db: D1Database):
(props: {
  updatedAt: dayjs.Dayjs
  userId: User['id']
  financialMonthId: FinancialMonth['id']
}) => D1PreparedStatement => (props) => {
  const stmt = `
  UPDATE income_records SET
    value = CASE
      WHEN d.kind = "related_by_workday" THEN d.value * w.count
      ELSE d.value
    END,
    updated_at = ?
  FROM
    financial_months m
    INNER JOIN workdays w ON m.id = w.financial_month_id
    INNER JOIN income_definitions d ON d.disabled_at > m.started_at
      AND d.enabled_at < m.ended_at
  WHERE
    income_records.financial_month_id = m.id
    AND income_records.updated_by != "user"
    AND d.kind == "related_by_workday"
    AND income_records.financial_month_id = ?
    AND income_records.user_id = ?
    AND income_records.definition_id = d.id
  `

  return db
    .prepare(stmt)
    .bind(
      props.updatedAt.valueOf(),
      props.financialMonthId,
      props.userId,
    )
}

export const updateWorkday = (db: D1Database):
(props: Pick<Workday, 'userId' | 'financialMonthId' | 'count'>) => Promise<Workday | undefined> => async ({
  userId, financialMonthId, count,
}) => {
  const updatedAt = dayjs()

  const queries: D1PreparedStatement[] = [
    buildWorkdayUpdateQuery(db)({
      userId,
      count,
      financialMonthId,
      updatedAt,
    }),
    buildIncomeRecordUpdateQuery(db)({
      userId,
      financialMonthId,
      updatedAt,
    }),
    d1(db)
      .select(WorkdayRecord, 'workdays')
      .where(condition('financial_month_id', '==', financialMonthId))
      .build(),
  ]

  const results = await db.batch<Workday>(queries)
  const updated = results.at(-1)?.results.at(0)

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
