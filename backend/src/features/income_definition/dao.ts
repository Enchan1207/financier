import { z } from 'zod'

import type { FinancialMonthData } from '@/domains/financial_month'
import { getPeriodByFinancialMonth } from '@/domains/financial_month/logic'
import type { IncomeDefinition } from '@/domains/income_definition'
import { IncomeDefinitionKind } from '@/domains/income_definition'
import type { User } from '@/domains/user'
import dayjs from '@/logic/dayjs'
import type { ConditionNode } from '@/logic/queryBuilder/conditionTree'
import { condition, every } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

const IncomeDefinitionRecord = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  kind: z.enum(IncomeDefinitionKind),
  value: z.number(),
  is_taxable: z.number(),
  enabled_at: z.number(),
  disabled_at: z.number(),
  updated_at: z.number(),
})

type IncomeDefinitionRecord = z.infer<typeof IncomeDefinitionRecord>

export const IncomeDefinitionSortKey = ['enabledAt', 'disabledAt', 'updatedAt'] as const
export type IncomeDefinitionSortKey = typeof IncomeDefinitionSortKey[number]

type MultilpleMonthsPeriod<T> = {
  from: T
  to: T
}

type SingleMonthPeriod<T> = { at: T }

type Period<T> = MultilpleMonthsPeriod<T> | SingleMonthPeriod<T>

export type IncomeDefinitionFindPeriod = Period<FinancialMonthData | number>

export type IncomeDefinitionFindCondition = {
  userId: User['id']
  sortBy: IncomeDefinitionSortKey
  kind?: IncomeDefinitionKind
  order: 'asc' | 'desc'
  limit: number
  offset?: number
  period?: IncomeDefinitionFindPeriod
}

const sortKeyMap: Record<IncomeDefinitionSortKey, keyof IncomeDefinitionRecord>
= {
  disabledAt: 'disabled_at',
  enabledAt: 'enabled_at',
  updatedAt: 'updated_at',
}

const makeRecord = (entity: IncomeDefinition): IncomeDefinitionRecord => ({
  id: entity.id,
  user_id: entity.userId,
  name: entity.name,
  kind: entity.kind,
  value: entity.value,
  is_taxable: entity.isTaxable ? 1 : 0,
  enabled_at: entity.enabledAt.valueOf(),
  disabled_at: entity.disabledAt.valueOf(),
  updated_at: entity.updatedAt.valueOf(),
})

const makeEntity = (record: IncomeDefinitionRecord): IncomeDefinition => ({
  id: record.id,
  userId: record.user_id,
  name: record.name,
  kind: record.kind,
  value: record.value,
  isTaxable: record.is_taxable === 1,
  enabledAt: dayjs(record.enabled_at),
  disabledAt: dayjs(record.disabled_at),
  updatedAt: dayjs(record.updated_at),
})

const buildIncomeDefinitionInsertionQuery = (db: D1Database):
(_: IncomeDefinitionRecord) => D1PreparedStatement =>
  (record) => {
    const base = 'INSERT INTO income_definitions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'

    const stmt = db.prepare(base).bind(
      record.id,
      record.user_id,
      record.name,
      record.kind,
      record.value,
      record.enabled_at,
      record.disabled_at,
      record.updated_at,
      record.is_taxable,
    )
    return stmt
  }

/** 報酬定義に基づく報酬実績をUPSERTするクエリを構築する */
const buildIncomeRecordInsertionQuery = (db: D1Database):
(id: IncomeDefinitionRecord['id']) => D1PreparedStatement =>
  (id) => {
    const base = `
    INSERT INTO
      income_records
    SELECT
      m.user_id,
      m.id AS financial_month_id,
      d.id AS definition_id,
      CASE
        WHEN d.kind = "related_by_workday" THEN d.value * w.count
        ELSE d.value
      END value,
      ? updated_at,
      "system" updated_by
    FROM
      financial_months m
      LEFT JOIN workdays w ON m.id = w.financial_month_id
      LEFT JOIN income_definitions d ON d.disabled_at > m.started_at
      AND d.enabled_at < m.ended_at
    WHERE
      d.id = ? ON CONFLICT (financial_month_id, definition_id) DO
    UPDATE
    SET
      updated_at = excluded.updated_at,
      value = excluded.value
    WHERE
      excluded.updated_by != "user"
  `

    const updatedAt = dayjs().valueOf()
    const stmt = db
      .prepare(base)
      .bind(
        updatedAt,
        id,
      )
    return stmt
  }

/** 報酬定義を挿入する */
export const insertIncomeDefinition = (db: D1Database):
(_: IncomeDefinition) => Promise<IncomeDefinition> =>
  async (entity) => {
    const record = makeRecord(entity)

    await db.batch([
      buildIncomeDefinitionInsertionQuery(db)(record),
      buildIncomeRecordInsertionQuery(db)(record.id),
    ])

    return entity
  }

interface IncomeDefinitionUpdateCondition {
  current: IncomeDefinition
  update: {
    name: string | undefined
    kind: IncomeDefinitionKind | undefined
    value: number | undefined
    isTaxable: boolean | undefined
    from: FinancialMonthData | undefined
    to: FinancialMonthData | undefined
  }
}

const buildIncomeDefinitionUpdateQuery = (db: D1Database):
(id: IncomeDefinition['id'], props: IncomeDefinitionUpdateCondition['update']) => D1PreparedStatement => (id, {
  name, kind, value, isTaxable, from, to,
}) => {
  const fromDate = from ? getPeriodByFinancialMonth(from) : undefined
  const toDate = to ? getPeriodByFinancialMonth(to) : undefined

  const updatePart = [
    name ? 'name=?' : undefined,
    kind ? 'kind=?' : undefined,
    value ? 'value=?' : undefined,
    fromDate ? 'enabled_at=?' : undefined,
    toDate ? 'disabled_at=?' : undefined,
    isTaxable ? 'is_taxable=?' : undefined,
    'updated_at=?',
  ]
    .filter(fragment => fragment !== undefined)
    .join(', ')

  const stmt = `UPDATE income_definitions SET ${updatePart} WHERE id=?`

  const params = [
    name,
    kind,
    value,
    isTaxable,
    fromDate?.start.valueOf(),
    toDate?.end.valueOf(),
    dayjs().valueOf(),
    id,
  ].filter(fragment => fragment !== undefined)

  const prepared = db
    .prepare(stmt)
    .bind(...params)

  return prepared
}

/** 現在の範囲から外れる定義をクリーンアップする */
const buildIncomeRecordCleanupQuery = (db: D1Database):
(id: IncomeDefinition['id']) => D1PreparedStatement => (id) => {
  const stmt = `
  DELETE from income_records
  WHERE
      EXISTS (
          SELECT
              1
          FROM
              income_records r
              LEFT JOIN financial_months m ON m.id = r.financial_month_id
              LEFT JOIN income_definitions d ON d.id = r.definition_id
          WHERE
              r.definition_id = ?
              AND (
                  m.started_at < d.enabled_at
                  OR m.started_at > d.disabled_at
              )
      )
  `

  return db
    .prepare(stmt)
    .bind(id)
}

/** 報酬定義を更新する */
export const updateIncomeDefinition = (db: D1Database):
(id: IncomeDefinition['id'], props: IncomeDefinitionUpdateCondition) => Promise<IncomeDefinition | undefined> =>
  async (id, input) => {
    const {
      update,
      current,
    } = input

    // 何も更新しないなら戻る
    const isEmpty = Object.values(update).every(param => param === undefined)
    if (isEmpty) {
      return current
    }

    const batchQueries: D1PreparedStatement[] = [
      buildIncomeDefinitionUpdateQuery(db)(current.id, update),
      buildIncomeRecordInsertionQuery(db)(current.id),
      buildIncomeRecordCleanupQuery(db)(current.id),
      d1(db)
        .select(IncomeDefinitionRecord, 'income_definitions')
        .where(condition('id', '==', id))
        .build(),
    ]

    const results = await db.batch<IncomeDefinitionRecord>(batchQueries)
    const totalOperatedRows = results
      .map(({ meta: { rows_read, rows_written } }) => ({
        rows_read,
        rows_written,
      }))
      .reduce((prev, next) => ({
        rows_read: prev.rows_read + next.rows_read,
        rows_written: prev.rows_written + next.rows_written,
      }), {
        rows_read: 0,
        rows_written: 0,
      })

    // TODO: こういう処理をデカいクエリの各所に置きたい
    console.log(totalOperatedRows)

    const record = results.at(-1)?.results.at(0)

    return record ? makeEntity(record) : undefined
  }

/** idを指定して報酬定義を取得する */
export const getIncomeDefinitionById = (db: D1Database):
(id: IncomeDefinition['id']) => Promise<IncomeDefinition | undefined> =>
  async (id) => {
    const stmt = d1(db)
      .select(IncomeDefinitionRecord, 'income_definitions')
      .where(condition('id', '==', id))
      .build()

    const result = await stmt.first<IncomeDefinitionRecord>()
    return result ? makeEntity(result) : undefined
  }

/** 単月指定を範囲表現に変換 */
const toMultipleMonthPeriod = <T>(period: Period<T>): MultilpleMonthsPeriod<T> => {
  const isMultipleMonthPeriod = <T>(period: unknown): period is MultilpleMonthsPeriod<T> =>
    (period as MultilpleMonthsPeriod<T>).from !== undefined

  if (isMultipleMonthPeriod(period)) {
    return period
  }
  else {
    return {
      from: period.at,
      to: period.at,
    }
  }
}

/** 期間情報からその開始・終了日時を計算 */
const getActualPeriod = (period: IncomeDefinitionFindPeriod): {
  start: dayjs.Dayjs
  end: dayjs.Dayjs
} => {
  const { from, to } = toMultipleMonthPeriod(period)

  const isNumber = (n: unknown): n is number => !Number.isNaN(Number(n))

  const startMonth: FinancialMonthData = isNumber(from)
    ? {
        financialYear: from,
        month: 4,
      }
    : from

  const endMonth: FinancialMonthData = isNumber(to)
    ? {
        financialYear: to,
        month: 3,
      }
    : to

  const { start } = getPeriodByFinancialMonth(startMonth)
  const { end } = getPeriodByFinancialMonth(endMonth)
  return {
    start,
    end,
  }
}

/** 報酬定義を検索する */
export const findIncomeDefinitions = (db: D1Database):
(props: IncomeDefinitionFindCondition) => Promise<IncomeDefinition[]> =>
  async ({
    userId, sortBy, kind, order, limit, offset, period,
  }) => {
    const conditionNodes: ConditionNode<typeof IncomeDefinitionRecord>[] = [
      condition('user_id', '==', userId),
    ]

    if (kind) {
      conditionNodes.push(condition('kind', '==', kind))
    }

    if (period) {
      const { start, end } = getActualPeriod(period)
      conditionNodes.push(
        condition('disabled_at', '>=', start.valueOf()),
        condition('enabled_at', '<=', end.valueOf()),
      )
    }

    const stmt = d1(db)
      .select(IncomeDefinitionRecord, 'income_definitions')
      .limit(limit, offset)
      .orderBy(sortKeyMap[sortBy], order)
      .where(every(...conditionNodes))
      .build()

    const { results } = await stmt.all<IncomeDefinitionRecord>()
    return results.map(makeEntity)
  }
