import dayjs from '@/logic/dayjs'
import { condition, every } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

import type { IncomeRecord } from '../domains/entity'
import type { IncomeRecordRepository } from '../domains/repository'
import { IncomeRecordRecord } from './entity'

const makeIncomeRecord = (record: IncomeRecordRecord): IncomeRecord => {
  return {
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
    user_id: entity.userId,
    financial_month_id: entity.financialMonthId,
    definition_id: entity.definitionId,
    value: entity.value,
    updated_at: entity.updatedAt.valueOf(),
    updated_by: entity.updatedBy,
  }
}

const insertIncomeRecord = (db: D1Database): IncomeRecordRepository['insertIncomeRecord'] => async (record) => {
  const stmt = `
  INSERT INTO
    income_records
  VALUES
    (?1, ?2, ?3, ?4, ?5, ?6)
  `
  const recordData = makeIncomeRecordRecord(record)

  await db.prepare(stmt).bind(
    recordData.user_id,
    recordData.financial_month_id,
    recordData.definition_id,
    recordData.value,
    recordData.updated_at,
    recordData.updated_by,
  ).run()

  return record
}

const findBy = (db: D1Database): IncomeRecordRepository['findBy'] => async ({ financialMonthId, definitionId }) => {
  const stmt = d1(db)
    .select(IncomeRecordRecord, 'income_records')
    .where(every(
      condition('financial_month_id', '==', financialMonthId),
      condition('definition_id', '==', definitionId),
    ))
    .build()

  const record = await stmt.first<IncomeRecordRecord>()
  return record ? makeIncomeRecord(record) : undefined
}

const updateIncomeRecordValue = (db: D1Database): IncomeRecordRepository['updateIncomeRecordValue'] => async ({ financialMonthId, definitionId }, value) => {
  const stmt = `
  UPDATE income_records
  SET
    value = ?,
    updated_at = ?
  WHERE
    financial_month_id = ?
    AND definition_id = ?
  `

  await db
    .prepare(stmt)
    .bind(
      value,
      dayjs().valueOf(),
      financialMonthId,
      definitionId)
    .run()

  const updated = d1(db)
    .select(IncomeRecordRecord, 'income_records')
    .where(every(
      condition('financial_month_id', '==', financialMonthId),
      condition('definition_id', '==', definitionId),
    ))
    .build()
    .first<IncomeRecordRecord>()
    .then(record => record ? makeIncomeRecord(record) : undefined)

  return updated
}

export const useIncomeRecordRepositoryD1 = (db: D1Database): IncomeRecordRepository => {
  return {
    insertIncomeRecord: insertIncomeRecord(db),
    findBy: findBy(db),
    updateIncomeRecordValue: updateIncomeRecordValue(db),
  }
}
