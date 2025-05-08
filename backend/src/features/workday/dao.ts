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
(props: {}) => D1PreparedStatement => (props) => {
  /*
   なんもわからん

   workdayに対応するfinancial_monthに関連するincome_recordsについて、
   workdayとdefinitionをjoinしてvalueを再計算する クエリ

   更新対象は workday.financial_month_id=? のレコードのみ

   financial_monthはidを持つ、workdayはfinancial_month_idを持つ
   income_definitinionはidを持つ、income_recordはfinancial_month_idとdefinition_idを持つ
   */
  const stmt = `
  `
}

export const updateWorkday = (db: D1Database):
(props: Pick<Workday, 'userId' | 'financialMonthId' | 'count'>) => Promise<Workday | undefined> => async (props) => {
  const updatedAt = dayjs()

  const queries: D1PreparedStatement[] = [
    buildWorkdayUpdateQuery(db)({
      userId: props.userId,
      count: props.count,
      financialMonthId: props.financialMonthId,
      updatedAt,
    }),
    buildIncomeRecordUpdateQuery(db)({
      //
    }),
    d1(db)
      .select(WorkdayRecord, 'workdays')
      .where(condition('financial_month_id', '==', props.financialMonthId))
      .build(),
  ]

  // TODO: 報酬実績値の更新

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
