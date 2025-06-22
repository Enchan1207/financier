import { z } from 'zod'

import type { DeductionDefinition } from '@/domains/deduction_definition'
import { DeductionDefinitionKind } from '@/domains/deduction_definition'
import type { FinancialMonthInfo } from '@/domains/financial_month_context'
import { getPeriodByFinancialMonth } from '@/domains/financial_month_context/logic'
import type { User } from '@/domains/user'
import dayjs from '@/logic/dayjs'
import type { ConditionNode } from '@/logic/query_builder/condition_tree'
import { condition, every } from '@/logic/query_builder/condition_tree'
import { d1 } from '@/logic/query_builder/d1'

const DeductionDefinitionRecord = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  kind: z.enum(DeductionDefinitionKind),
  value: z.number(),
  enabled_at: z.number(),
  disabled_at: z.number(),
  updated_at: z.number(),
})

type DeductionDefinitionRecord = z.infer<typeof DeductionDefinitionRecord>

const DeductionDefinitionSortKey = [
  'enabledAt',
  'disabledAt',
  'updatedAt',
] as const
type DeductionDefinitionSortKey = (typeof DeductionDefinitionSortKey)[number]

const sortKeyMap: Record<
  DeductionDefinitionSortKey,
  keyof DeductionDefinitionRecord
> = {
  disabledAt: 'disabled_at',
  enabledAt: 'enabled_at',
  updatedAt: 'updated_at',
}

const makeRecord = (
  entity: DeductionDefinition,
): DeductionDefinitionRecord => ({
  id: entity.id,
  user_id: entity.userId,
  name: entity.name,
  kind: entity.kind,
  value: entity.value,
  enabled_at: entity.enabledAt.valueOf(),
  disabled_at: entity.disabledAt.valueOf(),
  updated_at: entity.updatedAt.valueOf(),
})

const makeEntity = (
  record: DeductionDefinitionRecord,
): DeductionDefinition => ({
  id: record.id,
  userId: record.user_id,
  name: record.name,
  kind: record.kind,
  value: record.value,
  enabledAt: dayjs(record.enabled_at),
  disabledAt: dayjs(record.disabled_at),
  updatedAt: dayjs(record.updated_at),
})

/** 控除定義を挿入する */
export const insertDeductionDefinition =
  (
    db: D1Database,
  ): ((_: DeductionDefinition) => Promise<DeductionDefinition>) =>
  async (entity) => {
    const record = makeRecord(entity)

    const base =
      'INSERT INTO deduction_definitions VALUES (?, ?, ?, ?, ?, ?, ?, ?)'

    await db
      .prepare(base)
      .bind(
        record.id,
        record.user_id,
        record.name,
        record.kind,
        record.value,
        record.enabled_at,
        record.disabled_at,
        record.updated_at,
      )
      .run()

    return entity
  }

interface DeductionDefinitionUpdateCondition {
  current: DeductionDefinition
  update: {
    name: string | undefined
    kind: DeductionDefinitionKind | undefined
    value: number | undefined
    from: FinancialMonthInfo | undefined
    to: FinancialMonthInfo | undefined
  }
}

const buildDeductionDefinitionUpdateQuery =
  (
    db: D1Database,
  ): ((
    userId: User['id'],
    id: DeductionDefinition['id'],
    props: DeductionDefinitionUpdateCondition['update'],
  ) => D1PreparedStatement) =>
  (userId, id, { name, kind, value, from, to }) => {
    const fromDate = from ? getPeriodByFinancialMonth(from) : undefined
    const toDate = to ? getPeriodByFinancialMonth(to) : undefined

    const updatePart = [
      name ? 'name=?' : undefined,
      kind ? 'kind=?' : undefined,
      value ? 'value=?' : undefined,
      fromDate ? 'enabled_at=?' : undefined,
      toDate ? 'disabled_at=?' : undefined,
      'updated_at=?',
    ]
      .filter((fragment) => fragment !== undefined)
      .join(', ')

    const stmt = `UPDATE deduction_definitions SET ${updatePart} WHERE id=? AND user_id=?`

    const params = [
      name,
      kind,
      value,
      fromDate?.start.valueOf(),
      toDate?.end.valueOf(),
      dayjs().valueOf(),
      id,
      userId,
    ].filter((fragment) => fragment !== undefined)

    const prepared = db.prepare(stmt).bind(...params)

    return prepared
  }

/** 更新後の範囲から外れる実績をクリーンアップする */
const buildDeductionRecordCleanupQuery =
  (
    db: D1Database,
  ): ((
    userId: User['id'],
    id: DeductionDefinition['id'],
    props: {
      from: dayjs.Dayjs
      to: dayjs.Dayjs
    },
  ) => D1PreparedStatement) =>
  (userId, id, { from, to }) => {
    const stmt = `
  DELETE from deduction_records
  WHERE
    user_id = ?4
    AND definition_id = ?1
    AND financial_month_id IN (
      SELECT
        r.financial_month_id
      FROM
        deduction_records r
        LEFT JOIN financial_month_contexts m ON m.id = r.financial_month_id
        LEFT JOIN deduction_definitions d ON d.id = r.definition_id
      WHERE
        r.definition_id = ?1
        AND (
          m.ended_at < ?2
          OR m.started_at > ?3
        )
    )
  `

    return db.prepare(stmt).bind(id, from.valueOf(), to.valueOf(), userId)
  }

/** 控除定義を更新する */
export const updateDeductionDefinition =
  (
    db: D1Database,
  ): ((
    userId: User['id'],
    id: DeductionDefinition['id'],
    props: DeductionDefinitionUpdateCondition,
  ) => Promise<DeductionDefinition | undefined>) =>
  async (userId, id, input) => {
    const { update, current } = input

    // 何も更新しないなら戻る
    const isEmpty = Object.values(update).every((param) => param === undefined)
    if (isEmpty) {
      return current
    }

    const newFrom = update.from
      ? getPeriodByFinancialMonth(update.from).start
      : current.enabledAt

    const newTo = update.to
      ? getPeriodByFinancialMonth(update.to).end
      : current.disabledAt

    const batchQueries: D1PreparedStatement[] = [
      buildDeductionDefinitionUpdateQuery(db)(userId, current.id, update),
      buildDeductionRecordCleanupQuery(db)(userId, current.id, {
        from: newFrom,
        to: newTo,
      }),
      d1(db)
        .select(DeductionDefinitionRecord, 'deduction_definitions')
        .where(
          every(condition('id', '==', id), condition('user_id', '==', userId)),
        )
        .build(),
    ]

    const results = await db.batch<DeductionDefinitionRecord>(batchQueries)
    const totalOperatedRows = results
      .map(({ meta: { rows_read, rows_written } }) => ({
        rows_read,
        rows_written,
      }))
      .reduce(
        (prev, next) => ({
          rows_read: prev.rows_read + next.rows_read,
          rows_written: prev.rows_written + next.rows_written,
        }),
        {
          rows_read: 0,
          rows_written: 0,
        },
      )

    // TODO: こういう処理をデカいクエリの各所に置きたい
    console.log(totalOperatedRows)

    const record = results.at(-1)?.results.at(0)

    return record ? makeEntity(record) : undefined
  }

/** idを指定して控除定義を取得する */
export const getDeductionDefinitionById =
  (
    db: D1Database,
  ): ((
    userId: User['id'],
    id: DeductionDefinition['id'],
  ) => Promise<DeductionDefinition | undefined>) =>
  async (userId, id) => {
    const stmt = d1(db)
      .select(DeductionDefinitionRecord, 'deduction_definitions')
      .where(
        every(condition('id', '==', id), condition('user_id', '==', userId)),
      )
      .build()

    const result = await stmt.first<DeductionDefinitionRecord>()
    return result ? makeEntity(result) : undefined
  }

/** 控除定義を検索する */
export const findDeductionDefinitions =
  (
    db: D1Database,
  ): ((props: {
    userId: User['id']
    sortBy: DeductionDefinitionSortKey
    kind?: DeductionDefinitionKind
    order: 'asc' | 'desc'
    limit: number
    offset?: number
    period?: {
      start: dayjs.Dayjs
      end: dayjs.Dayjs
    }
  }) => Promise<DeductionDefinition[]>) =>
  async ({ userId, sortBy, kind, order, limit, offset, period }) => {
    const conditionNodes: ConditionNode<typeof DeductionDefinitionRecord>[] = [
      condition('user_id', '==', userId),
    ]

    if (kind) {
      conditionNodes.push(condition('kind', '==', kind))
    }

    if (period) {
      conditionNodes.push(
        condition('disabled_at', '>=', period.start.valueOf()),
        condition('enabled_at', '<=', period.end.valueOf()),
      )
    }

    const stmt = d1(db)
      .select(DeductionDefinitionRecord, 'deduction_definitions')
      .limit(limit, offset)
      .orderBy(sortKeyMap[sortBy], order)
      .where(every(...conditionNodes))
      .build()

    const { results } = await stmt.all<DeductionDefinitionRecord>()
    return results.map(makeEntity)
  }
