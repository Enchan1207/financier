import { getPeriodByFinancialMonth } from '@/features/financial_months/domain/valueObject'
import dayjs from '@/logic/dayjs'
import { condition, every } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

import type { IncomeDefinition } from '../domain/entity'
import type { IncomeDefinitionRepository, IncomeDefinitionSortKey } from '../domain/repository'
import { IncomeDefinitionRecord } from './entity'

const makeIncomeDefinitionRecord = (entity: IncomeDefinition): IncomeDefinitionRecord => {
  return {
    id: entity.id,
    user_id: entity.userId,
    name: entity.name,
    kind: entity.kind,
    value: entity.value,
    enabled_at: entity.enabledAt.valueOf(),
    disabled_at: entity.disabledAt.valueOf(),
    updated_at: entity.updatedAt.valueOf(),
  }
}

const makeIncomeDefinition = (record: IncomeDefinitionRecord): IncomeDefinition => {
  return {
    id: record.id,
    userId: record.user_id,
    name: record.name,
    kind: record.kind,
    value: record.value,
    enabledAt: dayjs(record.enabled_at),
    disabledAt: dayjs(record.disabled_at),
    updatedAt: dayjs(record.updated_at),
  }
}

const sortKeyMap: Record<IncomeDefinitionSortKey, keyof IncomeDefinitionRecord>
= {
  disabledAt: 'disabled_at',
  enabledAt: 'enabled_at',
  updatedAt: 'updated_at',
}

const insertIncomeDefinition = (db: D1Database): IncomeDefinitionRepository['insertIncomeDefinition'] => async (incomeDefinition) => {
  const stmt = 'INSERT INTO income_definitions VALUES (?, ?, ?, ?, ?, ?, ?, ?)'

  const record = makeIncomeDefinitionRecord(incomeDefinition)

  await db.prepare(stmt).bind(
    record.id,
    record.user_id,
    record.name,
    record.kind,
    record.value,
    record.enabled_at,
    record.disabled_at,
    record.updated_at,
  ).run()

  return incomeDefinition
}

const updateIncomeDefinition = (db: D1Database): IncomeDefinitionRepository['updateIncomeDefinition'] => async (id, input) => {
  const {
    name, kind, value, enabledAt, disabledAt, updatedAt,
  } = input

  const fragments = [
    'UPDATE income_definitions SET',
    name ? 'name=?' : undefined,
    kind ? 'kind=?' : undefined,
    value ? 'value=?' : undefined,
    enabledAt ? 'enabled_at=?' : undefined,
    disabledAt ? 'disabled_at=?' : undefined,
    updatedAt ? 'updated_at=?' : undefined,
    'WHERE id=?',
  ].filter(fragment => fragment !== undefined)

  const params = [
    name,
    kind,
    value,
    enabledAt?.valueOf(),
    disabledAt?.valueOf(),
    updatedAt?.valueOf(),
    id,
  ].filter(fragment => fragment !== undefined)

  const stmt = fragments.join(' ')
  const updated = await db
    .prepare(stmt)
    .bind(...params)
    .first<IncomeDefinitionRecord>()

  return updated ? makeIncomeDefinition(updated) : undefined
}

const deleteIncomeDefinition = (db: D1Database): IncomeDefinitionRepository['deleteIncomeDefinition'] => async (id) => {
  const stmt = 'DELETE FROM income_definitions WHERE id=?'
  const deleted = await db
    .prepare(stmt)
    .bind(id)
    .first<IncomeDefinitionRecord>()

  return deleted ? makeIncomeDefinition(deleted) : undefined
}

const findByUserId = (db: D1Database): IncomeDefinitionRepository['findByUserId'] => async ({
  sortBy, userId, limit, order, offset, filter,
}) => {
  const base = d1(db)
    .select(IncomeDefinitionRecord, 'income_definitions')
    .limit(limit, offset)
    .orderBy(sortKeyMap[sortBy], order)

  const filtered = filter
    ? base.where(every(
        condition('user_id', '==', userId),
        condition('kind', '==', filter),
      ))
    : base.where(condition('user_id', '==', userId))

  const stmt = filtered.build()

  const { results } = await stmt.all<IncomeDefinitionRecord>()
  return results.map(makeIncomeDefinition)
}

const findById = (db: D1Database): IncomeDefinitionRepository['findById'] => async (id) => {
  const stmt = d1(db)
    .select(IncomeDefinitionRecord, 'income_definitions')
    .where(condition('id', '==', id))
    .build()

  const result = await stmt.first<IncomeDefinitionRecord>()
  return result ? makeIncomeDefinition(result) : undefined
}

const findByFinancialMonth = (db: D1Database): IncomeDefinitionRepository['findByFinancialMonth'] => async ({
  userId, financialMonth, sortBy, filter, order, limit, offset,
}) => {
  const period = getPeriodByFinancialMonth(financialMonth)
  const start = period.start.valueOf()
  const end = period.end.valueOf()

  const base = d1(db)
    .select(IncomeDefinitionRecord, 'income_definitions')
    .limit(limit, offset)
    .orderBy(sortKeyMap[sortBy], order)

  const filtered = filter
    ? base.where(every(
        condition('user_id', '==', userId),
        condition('kind', '==', filter),
        every(
          condition('enabled_at', '>=', start),
          condition('disabled_at', '<=', end),
        ),
      ))
    : base.where(every(
        condition('user_id', '==', userId),
        every(
          condition('enabled_at', '>=', start),
          condition('disabled_at', '<=', end),
        ),
      ))

  const stmt = filtered.build()

  const { results } = await stmt.all<IncomeDefinitionRecord>()
  return results.map(makeIncomeDefinition)
}

const findByFinancialYear = (db: D1Database): IncomeDefinitionRepository['findByFinancialYear'] => async ({
  userId, financialYear, sortBy, filter, order, limit, offset,
}) => {
  const { start } = getPeriodByFinancialMonth({
    financialYear,
    month: 4,
  })

  const { end } = getPeriodByFinancialMonth({
    financialYear,
    month: 3,
  })

  const base = d1(db)
    .select(IncomeDefinitionRecord, 'income_definitions')
    .limit(limit, offset)
    .orderBy(sortKeyMap[sortBy], order)

  const filtered = filter
    ? base.where(every(
        condition('user_id', '==', userId),
        condition('kind', '==', filter),
        every(
          condition('enabled_at', '>=', start.valueOf()),
          condition('disabled_at', '<=', end.valueOf()),
        ),
      ))
    : base.where(every(
        condition('user_id', '==', userId),
        every(
          condition('enabled_at', '>=', start.valueOf()),
          condition('disabled_at', '<=', end.valueOf()),
        ),
      ))

  const stmt = filtered.build()

  const { results } = await stmt.all<IncomeDefinitionRecord>()
  return results.map(makeIncomeDefinition)
}

export const useIncomeDefinitionRepositoryD1 = (db: D1Database): IncomeDefinitionRepository => {
  return {
    insertIncomeDefinition: insertIncomeDefinition(db),
    updateIncomeDefinition: updateIncomeDefinition(db),
    deleteIncomeDefinition: deleteIncomeDefinition(db),
    findByUserId: findByUserId(db),
    findById: findById(db),
    findByFinancialMonth: findByFinancialMonth(db),
    findByFinancialYear: findByFinancialYear(db),
  }
}
