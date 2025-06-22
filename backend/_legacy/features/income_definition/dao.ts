import { z } from 'zod'

import type { FinancialMonthInfo } from '@/domains/financial_month_context'
import { getPeriodByFinancialMonth } from '@/domains/financial_month_context/logic'
import type { IncomeDefinition } from '@/domains/income_definition'
import { IncomeDefinitionKind } from '@/domains/income_definition'
import type { User } from '@/domains/user'
import dayjs from '@/logic/dayjs'
import type { ConditionNode } from '@/logic/query_builder/condition_tree'
import { condition, every } from '@/logic/query_builder/condition_tree'
import { d1 } from '@/logic/query_builder/d1'

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

const IncomeDefinitionSortKey = [
  'enabledAt',
  'disabledAt',
  'updatedAt',
] as const
type IncomeDefinitionSortKey = (typeof IncomeDefinitionSortKey)[number]

const sortKeyMap: Record<
  IncomeDefinitionSortKey,
  keyof IncomeDefinitionRecord
> = {
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

/** 報酬定義を挿入する */
export const insertIncomeDefinition =
  (db: D1Database): ((_: IncomeDefinition) => Promise<IncomeDefinition>) =>
  async (entity) => {
    const record = makeRecord(entity)

    await d1(db)
      .insert(IncomeDefinitionRecord, 'income_definitions')
      .values(record)
      .build()
      .run()

    return entity
  }

interface IncomeDefinitionUpdateCondition {
  current: IncomeDefinition
  update: {
    name: string | undefined
    kind: IncomeDefinitionKind | undefined
    value: number | undefined
    isTaxable: boolean | undefined
    from: FinancialMonthInfo | undefined
    to: FinancialMonthInfo | undefined
  }
}

const buildIncomeDefinitionUpdateQuery =
  (
    db: D1Database,
  ): ((
    userId: User['id'],
    id: IncomeDefinition['id'],
    props: IncomeDefinitionUpdateCondition['update'],
  ) => D1PreparedStatement) =>
  (userId, id, { name, kind, value, isTaxable, from, to }) => {
    const fromDate = from ? getPeriodByFinancialMonth(from) : undefined
    const toDate = to ? getPeriodByFinancialMonth(to) : undefined

    const query = d1(db)
      .update(IncomeDefinitionRecord, 'income_definitions')
      .where(
        every(
          every(condition('id', '==', id), condition('user_id', '==', userId)),
        ),
      )
      .set({
        name,
        kind,
        value,
        is_taxable: isTaxable !== undefined ? (isTaxable ? 1 : 0) : undefined,
        enabled_at: fromDate?.start.valueOf(),
        disabled_at: toDate?.end.valueOf(),
        updated_at: dayjs().valueOf(),
      })
      .build()

    return query
  }

/** 更新後の範囲から外れる実績をクリーンアップする */
const buildIncomeRecordCleanupQuery =
  (
    db: D1Database,
  ): ((
    userId: User['id'],
    id: IncomeDefinition['id'],
    props: {
      from: dayjs.Dayjs
      to: dayjs.Dayjs
    },
  ) => D1PreparedStatement) =>
  (userId, id, { from, to }) => {
    const stmt = `
  DELETE from income_records
  WHERE
    user_id = ?4
    AND definition_id = ?1
    AND financial_month_id IN (
      SELECT
        r.financial_month_id
      FROM
        income_records r
        LEFT JOIN financial_month_contexts m ON m.id = r.financial_month_id
        LEFT JOIN income_definitions d ON d.id = r.definition_id
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

/** 報酬定義を更新する */
export const updateIncomeDefinition =
  (
    db: D1Database,
  ): ((
    userId: User['id'],
    id: IncomeDefinition['id'],
    props: IncomeDefinitionUpdateCondition,
  ) => Promise<IncomeDefinition | undefined>) =>
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
      buildIncomeDefinitionUpdateQuery(db)(userId, current.id, update),
      buildIncomeRecordCleanupQuery(db)(userId, current.id, {
        from: newFrom,
        to: newTo,
      }),
      d1(db)
        .select(IncomeDefinitionRecord, 'income_definitions')
        .where(
          every(condition('id', '==', id), condition('user_id', '==', userId)),
        )
        .build(),
    ]

    const results = await db.batch<IncomeDefinitionRecord>(batchQueries)
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

/** idを指定して報酬定義を取得する */
export const getIncomeDefinitionById =
  (
    db: D1Database,
  ): ((
    userId: User['id'],
    id: IncomeDefinition['id'],
  ) => Promise<IncomeDefinition | undefined>) =>
  async (userId, id) => {
    const stmt = d1(db)
      .select(IncomeDefinitionRecord, 'income_definitions')
      .where(
        every(condition('id', '==', id), condition('user_id', '==', userId)),
      )
      .build()

    const result = await stmt.first<IncomeDefinitionRecord>()
    return result ? makeEntity(result) : undefined
  }

/** 報酬定義を検索する */
export const findIncomeDefinitions =
  (
    db: D1Database,
  ): ((props: {
    userId: User['id']
    sortBy: IncomeDefinitionSortKey
    kind?: IncomeDefinitionKind
    order: 'asc' | 'desc'
    limit: number
    offset?: number
    period?: {
      start: dayjs.Dayjs
      end: dayjs.Dayjs
    }
  }) => Promise<IncomeDefinition[]>) =>
  async ({ userId, sortBy, kind, order, limit, offset, period }) => {
    const conditionNodes: ConditionNode<typeof IncomeDefinitionRecord>[] = [
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
      .select(IncomeDefinitionRecord, 'income_definitions')
      .limit(limit, offset)
      .orderBy(sortKeyMap[sortBy], order)
      .where(every(...conditionNodes))
      .build()

    const { results } = await stmt.all<IncomeDefinitionRecord>()
    return results.map(makeEntity)
  }
