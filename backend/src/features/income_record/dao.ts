import { z } from 'zod'

import type { IncomeRecord } from '@/domains/income_record'
import { IncomeRecordUpdator } from '@/domains/income_record'
import dayjs from '@/logic/dayjs'
import { condition, every } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

// 草
export const IncomeRecordRecord = z.object({
  user_id: z.string(),

  financial_month_id: z.string(),
  definition_id: z.string(),

  value: z.number(),

  updated_at: z.number(),
  updated_by: z.enum(IncomeRecordUpdator),
})
type IncomeRecordRecord = z.infer<typeof IncomeRecordRecord>

const makeEntity = (record: IncomeRecordRecord): IncomeRecord => ({
  userId: record.user_id,
  financialMonthId: record.financial_month_id,
  definitionId: record.definition_id,
  value: record.value,
  updatedAt: dayjs(record.updated_at),
  updatedBy: record.updated_by,
})

/** 月度idと定義idから実績を取得 */
export const findIncomeRecord = (db: D1Database):
(_: {
  financialMonthId: string
  definitionId: string
}) => Promise<IncomeRecord | undefined> => async ({ financialMonthId, definitionId }) => {
  const stmt = d1(db)
    .select(IncomeRecordRecord, 'income_records')
    .where(every(
      condition('financial_month_id', '==', financialMonthId),
      condition('definition_id', '==', definitionId),
    ))
    .build()

  const record = await stmt.first<IncomeRecordRecord>()
  return record ? makeEntity(record) : undefined
}

export const updateIncomeRecordValue = (db: D1Database):
(_: {
  userId: string
  financialMonthId: string
  definitionId: string
  value: number
}) => Promise<IncomeRecord | undefined> => async ({
  userId, financialMonthId, definitionId, value,
}) => {
  const updateStmt = `
  UPDATE income_records
  SET
    value = ?,
    updated_at = ?,
    updated_by = "user"
  WHERE
    financial_month_id = ?
    AND definition_id = ?
    AND user_id = ?
  `

  const updateQuery = db
    .prepare(updateStmt)
    .bind(
      value,
      dayjs().valueOf(),
      financialMonthId,
      definitionId,
      userId,
    )

  const getQuery = d1(db)
    .select(IncomeRecordRecord, 'income_records')
    .where(every(
      condition('financial_month_id', '==', financialMonthId),
      condition('definition_id', '==', definitionId),
      condition('user_id', '==', userId),
    ))
    .build()

  const queryResults = await db
    .batch<IncomeRecordRecord>([updateQuery, getQuery])
  const updatedRaw = queryResults[1].results.at(0)

  return updatedRaw ? makeEntity(updatedRaw) : undefined
}

// TODO: 報酬実績のリセット (システム自動計算に戻す)
