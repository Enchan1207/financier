import { z } from 'zod'

import type { FinancialMonthContext } from '@/domains/financial_month_context'
import type { IncomeRecord, IncomeRecordItem } from '@/domains/income_record'
import { IncomeRecordUpdator } from '@/domains/income_record'
import type { User } from '@/domains/user'
import dayjs from '@/logic/dayjs'
import { condition, every } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

type IncomeRecordItemRecord = {
  user_id: User['id']
  name: string
  value: number
}

const makeIncomeRecordItemEntity = ({
  user_id,
  name,
  value,
}: IncomeRecordItemRecord): IncomeRecordItem => ({
  userId: user_id,
  name,
  value,
})

/** 報酬定義エンティティのRDBレコードスキーマ */
const IncomeRecordRecordSchema = z.object({
  user_id: z.string(),

  financial_month_id: z.string(),
  definition_id: z.string(),

  value: z.number(),

  updated_at: z.number(),
  updated_by: z.enum(IncomeRecordUpdator),
})
type IncomeRecordRecord = z.infer<typeof IncomeRecordRecordSchema>

const makeIncomeRecordEntity = (record: IncomeRecordRecord): IncomeRecord => ({
  userId: record.user_id,
  financialMonthId: record.financial_month_id,
  definitionId: record.definition_id,
  value: record.value,
  updatedAt: dayjs(record.updated_at),
  updatedBy: record.updated_by,
})

const makeRecord = (entity: IncomeRecord): IncomeRecordRecord => ({
  user_id: entity.userId,
  financial_month_id: entity.financialMonthId,
  definition_id: entity.definitionId,
  value: entity.value,
  updated_at: entity.updatedAt.valueOf(),
  updated_by: entity.updatedBy,
})

/** 月度idと定義idから実績を取得 */
export const findIncomeRecord =
  (
    db: D1Database,
  ): ((_: {
    financialMonthId: string
    definitionId: string
  }) => Promise<IncomeRecord | undefined>) =>
  async ({ financialMonthId, definitionId }) => {
    const stmt = d1(db)
      .select(IncomeRecordRecordSchema, 'income_records')
      .where(
        every(
          condition('financial_month_id', '==', financialMonthId),
          condition('definition_id', '==', definitionId),
        ),
      )
      .build()

    const record = await stmt.first<IncomeRecordRecord>()
    return record ? makeIncomeRecordEntity(record) : undefined
  }

/**
 * 報酬実績を挿入する
 * @warning このメソッドは定義と実績の正しさ (期間が被っているかなど) を保証しません。
 * そういうのはワークフローでやってください。
 */
export const insertIncomeRecord =
  (db: D1Database): ((_: IncomeRecord) => Promise<IncomeRecord>) =>
  async (entity) => {
    const record = makeRecord(entity)

    await d1(db)
      .insert(IncomeRecordRecordSchema, 'income_records')
      .values(record)
      .build()
      .run()

    return entity
  }

/**
 * 報酬実績の値を更新する
 */
export const updateIncomeRecordValue =
  (
    db: D1Database,
  ): ((_: {
    userId: string
    financialMonthId: string
    definitionId: string
    value: number
  }) => Promise<IncomeRecord | undefined>) =>
  async ({ userId, financialMonthId, definitionId, value }) => {
    const upsertStmt = `
  INSERT INTO income_records
  VALUES (?, ?, ?, ?, ?, "user")
  ON CONFLICT (financial_month_id, definition_id) DO UPDATE SET 
    value = excluded.value,
    updated_at = excluded.updated_at,
    updated_by = excluded.updated_by
  `

    const upsertQuery = db
      .prepare(upsertStmt)
      .bind(userId, financialMonthId, definitionId, value, dayjs().valueOf())

    const getQuery = d1(db)
      .select(IncomeRecordRecordSchema, 'income_records')
      .where(
        every(
          condition('financial_month_id', '==', financialMonthId),
          condition('definition_id', '==', definitionId),
          condition('user_id', '==', userId),
        ),
      )
      .build()

    const queryResults = await db.batch<IncomeRecordRecord>([
      upsertQuery,
      getQuery,
    ])
    const updatedRaw = queryResults[1].results.at(0)

    return updatedRaw ? makeIncomeRecordEntity(updatedRaw) : undefined
  }

/**
 * 報酬実績をリセット
 */
export const resetIncomeRecordValue =
  (
    db: D1Database,
  ): ((_: {
    userId: string
    financialMonthId: string
    definitionId: string
  }) => Promise<void>) =>
  async (props) => {
    const query = `
  DELETE from income_records
  WHERE 
    user_id = ?1
    AND financial_month_id = ?2
    AND definition_id = ?3
  `

    await db
      .prepare(query)
      .bind(props.userId, props.financialMonthId, props.definitionId)
      .run()
  }

export const listIncomeRecordItems =
  (
    db: D1Database,
  ): ((_: {
    userId: User['id']
    financialMonth: FinancialMonthContext
  }) => Promise<IncomeRecordItem[]>) =>
  async ({ userId, financialMonth }) => {
    const query = `
      SELECT
        m.user_id,
        d.name,
        d.kind,
        CASE
          WHEN r.value IS NOT NULL THEN r.value
          ELSE CASE
            WHEN d.kind = 'absolute' THEN d.value
            WHEN d.kind = 'related_by_workday' THEN m.workday * d.value
            ELSE -1
          END
        END value
      FROM
        financial_month_contexts m
        LEFT JOIN income_definitions d ON d.user_id = ?2
        AND d.enabled_at <= m.ended_at
        AND d.disabled_at >= m.started_at
        LEFT JOIN income_records r ON r.financial_month_id = m.id
        AND r.definition_id = d.id
        AND r.user_id = m.user_id
      WHERE
        m.id = ?1 
        AND m.user_id = ?2
    `

    const { results } = await db
      .prepare(query)
      .bind(financialMonth.id, userId)
      .all<IncomeRecordItemRecord>()

    return results.map(makeIncomeRecordItemEntity)
  }
