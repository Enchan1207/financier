import { z } from 'zod'

import type { FinancialMonthData } from '@/domains/financial_month'
import { getPeriodByFinancialMonth } from '@/domains/financial_month/logic'
import type { IncomeDefinition } from '@/domains/income_definition'
import { IncomeDefinitionKind } from '@/domains/income_definition'
import type { createIncomeDefinition } from '@/domains/income_definition/logic'
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

const IncomeDefinitionSortKey = ['enabledAt', 'disabledAt', 'updatedAt'] as const
type IncomeDefinitionSortKey = typeof IncomeDefinitionSortKey[number]

type MultilpleMonthsPeriod<T> = {
  from: T
  to: T
}

type SingleMonthPeriod<T> = { at: T }

type Period<T> = MultilpleMonthsPeriod<T> | SingleMonthPeriod<T>

type IncomeDefinitionFindPeriod = Period<FinancialMonthData | number>

type IncomeDefinitionFindCondition = {
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

// TODO: daoレベルで報酬実績の自動挿入を試みてもよいのでは?

/** 報酬定義を挿入する */
export const insertIncomeDefinition = (db: D1Database):
(entity: IncomeDefinition) => Promise<IncomeDefinition> =>
  async (entity) => {
    const stmt = 'INSERT INTO income_definitions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'

    const record = makeRecord(entity)

    await db.prepare(stmt).bind(
      record.id,
      record.user_id,
      record.name,
      record.kind,
      record.value,
      record.enabled_at,
      record.disabled_at,
      record.updated_at,
      record.is_taxable,
    ).run()

    return entity
  }

/** 報酬定義を更新する */
export const updateIncomeDefinition = (db: D1Database):
(id: IncomeDefinition['id'], input: Partial<Omit<Parameters<typeof createIncomeDefinition>[0], 'userId'>>) => Promise<IncomeDefinition | undefined> =>
  async (id, input) => {
    const {
      name, kind, value, isTaxable, from, to,
    } = input

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

    await db
      .prepare(stmt)
      .bind(...params)
      .run()

    const updated = d1(db)
      .select(IncomeDefinitionRecord, 'income_definitions')
      .where(condition('id', '==', id))
      .build()
      .first<IncomeDefinitionRecord>()
      .then(record => record ? makeEntity(record) : undefined)

    return updated
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

  const isNumber = (n: unknown): n is number => !Number.isNaN(n)

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
