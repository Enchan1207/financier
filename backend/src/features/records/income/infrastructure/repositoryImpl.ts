import dayjs from '@/logic/dayjs'
import { condition } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

import type { IncomeRecord } from '../domain/entity'
import type { IncomeRecordRepository } from '../domain/repository'
import { IncomeRecordRecord } from './entity'

const makeIncomeRecord = (record: IncomeRecordRecord): IncomeRecord => {
  return {
    id: record.id,
    userId: record.user_id,
    financialMonthId: record.financial_month_id,
    definitionId: record.definition_id,
    value: record.value,
    updatedAt: dayjs(record.updated_at),
    updatedBy: record.updated_by,
  }
}

const makeIncomeRecordRecord = (entity: IncomeRecord): IncomeRecordRecord => {
  return {
    id: entity.id,
    user_id: entity.userId,
    financial_month_id: entity.financialMonthId,
    definition_id: entity.definitionId,
    value: entity.value,
    updated_at: entity.updatedAt.valueOf(),
    updated_by: entity.updatedBy,
  }
}

const insertIncomeRecord = (db: D1Database): IncomeRecordRepository['insertIncomeRecord'] => async (record) => {
  const stmt = `INSERT INTO income_records VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
  const recordData = makeIncomeRecordRecord(record)

  await db.prepare(stmt).bind(
    recordData.id,
    recordData.user_id,
    recordData.financial_month_id,
    recordData.definition_id,
    recordData.value,
    recordData.updated_at,
    recordData.updated_by,
  ).run()

  return record
}

const findById = (db: D1Database): IncomeRecordRepository['findById'] => async (id) => {
  const stmt = d1(db)
    .select(IncomeRecordRecord, 'income_records')
    .where(condition('id', '==', id))
    .build()

  const record = await stmt.first<IncomeRecordRecord>()
  return record ? makeIncomeRecord(record) : undefined
}

export const useIncomeRecordRepositoryD1 = (db: D1Database) => {
  return {
    insertIncomeRecord: insertIncomeRecord(db),
    findById: findById(db),
  }
}
