import type { IncomeDefinition } from '../domain/entity'
import type { IncomeDefinitionRepository } from '../domain/repository'
import type { IncomeDefinitionRecord } from './entity'

const makeIncomeDefinitionRecord = (entity: IncomeDefinition): IncomeDefinitionRecord => {
  return {
    id: entity.id,
    user_id: entity.userId,
    kind: entity.kind,
    value: entity.value,
    enabled_at: entity.enabledAt.valueOf(),
    disabled_at: entity.disabledAt.valueOf(),
    updated_at: entity.updatedAt.valueOf(),
  }
}

const insertIncomeDefinition = (db: D1Database): IncomeDefinitionRepository['insertIncomeDefinition'] => async (incomeDefinition) => {
  const stmt = `INSERT INTO income_definitions VALUES (?, ?, ?, ?, ?, ?, ?)`

  const record = makeIncomeDefinitionRecord(incomeDefinition)

  await db.prepare(stmt).bind(
    record.id,
    record.updated_at,
    record.kind,
    record.value,
    record.enabled_at,
    record.disabled_at,
    record.updated_at,
  ).run()

  return incomeDefinition
}

const updateIncomeDefinition = (db: D1Database): IncomeDefinitionRepository['updateIncomeDefinition'] => async (id, input) => {
  throw new Error('method not implemented')
}

const findByUserId = (db: D1Database): IncomeDefinitionRepository['findByUserId'] => async (userId) => {
  throw new Error('method not implemented')
}

const findById = (db: D1Database): IncomeDefinitionRepository['findById'] => async (id) => {
  throw new Error('method not implemented')
}

const findByFinancialMonth = (db: D1Database): IncomeDefinitionRepository['findByFinancialMonth'] => async (props) => {
  throw new Error('method not implemented')
}

const findByFinancialYear = (db: D1Database): IncomeDefinitionRepository['findByFinancialYear'] => async (props) => {
  throw new Error('method not implemented')
}

export const useIncomeDefinitionRepositoryD1 = (db: D1Database): IncomeDefinitionRepository => {
  return {
    insertIncomeDefinition: insertIncomeDefinition(db),
    updateIncomeDefinition: updateIncomeDefinition(db),
    findByUserId: findByUserId(db),
    findById: findById(db),
    findByFinancialMonth: findByFinancialMonth(db),
    findByFinancialYear: findByFinancialYear(db),
  }
}
