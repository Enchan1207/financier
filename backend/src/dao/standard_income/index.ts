import { z } from 'zod'

import type {
  StandardIncomeGrade,
  StandardIncomeTable,
  StandardIncomeTableSummary,
} from '@/domains/standard_income'
import type { User } from '@/domains/user'
import { condition, every } from '@/logic/query_builder/condition_tree'
import { d1 } from '@/logic/query_builder/d1'

import {
  makeStandardIncomeRecord,
  makeStandardIncomeTableEntity,
  StandardIncomeGradeRecord,
  StandardIncomeTableRecord,
} from './schema'

/** 新しい標準報酬月額表を追加 */
const insertStandardIncomeTable =
  (
    db: D1Database,
  ): ((item: StandardIncomeTable) => Promise<StandardIncomeTable>) =>
  async (entity) => {
    const [tableRecord, gradeRecords] = makeStandardIncomeRecord(entity)

    const tableInsertQuery = d1(db)
      .insert(StandardIncomeTableRecord, 'standard_income_tables')
      .values(tableRecord)
      .build()

    const gradeBase = d1(db).insert(
      StandardIncomeGradeRecord,
      'standard_income_grades',
    )
    const gradeInsertQueries = gradeRecords.map((grade) =>
      gradeBase.values(grade).build(),
    )

    const queries = [tableInsertQuery, ...gradeInsertQueries]
    await db.batch(queries)

    return entity
  }

/** 標準報酬月額表の名前を変更する */
const updateStandardIncomeTableName =
  (
    db: D1Database,
  ): ((props: {
    userId: User['id']
    id: StandardIncomeTable['id']
    name: StandardIncomeTable['name']
  }) => Promise<StandardIncomeTableSummary | undefined>) =>
  async (props) => {
    const updateQuery = d1(db)
      .update(StandardIncomeTableRecord, 'standard_income_tables')
      .where(
        every(
          condition('id', '==', props.id),
          condition('user_id', '==', props.userId),
        ),
      )
      .set({
        name: props.name,
      })
      .build()

    const getQuery = d1(db)
      .select(StandardIncomeTableRecord, 'standard_income_tables')
      .where(
        every(
          condition('id', '==', props.id),
          condition('user_id', '==', props.userId),
        ),
      )
      .limit(1)
      .build()

    const queries = [updateQuery, getQuery]
    const results = await db.batch<StandardIncomeTableRecord>(queries)

    const tableRecord = results.at(-1)?.results.at(0)
    if (tableRecord === undefined) {
      return undefined
    }

    return {
      id: tableRecord.id,
      userId: tableRecord.user_id,
      name: tableRecord.name,
    }
  }

/** 標準報酬月額表の階級を変更する */
const updateStandardIncomeTableGrades =
  (
    db: D1Database,
  ): ((props: {
    userId: User['id']
    id: StandardIncomeTable['id']
    grades: StandardIncomeGrade[]
  }) => Promise<StandardIncomeTableSummary | undefined>) =>
  async (props) => {
    const gradeRecords: StandardIncomeGradeRecord[] = props.grades.map(
      (grade) => ({
        income_table_id: props.id,
        threshold: grade.threshold,
        standard_income: grade.standardIncome,
      }),
    )

    const gradeBase = d1(db).insert(
      StandardIncomeGradeRecord,
      'standard_income_grades',
    )
    const gradeInsertQueries = gradeRecords.map((record) =>
      gradeBase.values(record).build(),
    )

    const gradeCleanupQuery = d1(db)
      .delete(StandardIncomeGradeRecord, 'standard_income_grades')
      .where(condition('income_table_id', '==', props.id))
      .build()

    const tableFetchQuery = d1(db)
      .select(StandardIncomeTableRecord, 'standard_income_tables')
      .where(
        every(
          condition('id', '==', props.id),
          condition('user_id', '==', props.userId),
        ),
      )
      .limit(1)
      .build()

    const queries = [gradeCleanupQuery, ...gradeInsertQueries, tableFetchQuery]
    const results = await db.batch<StandardIncomeTableRecord>(queries)

    const result = results.at(-1)?.results.at(0)
    if (result === undefined) {
      return undefined
    }

    return {
      id: result.id,
      userId: result.user_id,
      name: result.name,
    }
  }

/** 登録されている標準報酬月額表の一覧を得る */
const listStandardIncomeTables =
  (
    db: D1Database,
  ): ((props: {
    userId: User['id']
    order?: 'asc' | 'desc'
  }) => Promise<StandardIncomeTableSummary[]>) =>
  async (props) => {
    const query = d1(db)
      .select(StandardIncomeTableRecord, 'standard_income_tables')
      .where(condition('user_id', '==', props.userId))
      .orderBy('id', props.order)
      .build()

    const { results } = await query.all<StandardIncomeTableRecord>()
    return results.map((result) => ({
      id: result.id,
      userId: result.user_id,
      name: result.name,
    }))
  }

/** IDを指定して標準報酬月額表を取得する */
const getStandardIncomeTable =
  (
    db: D1Database,
  ): ((props: {
    userId: User['id']
    id: StandardIncomeTable['id']
  }) => Promise<StandardIncomeTable | undefined>) =>
  async (props) => {
    const tableFetchQuery = d1(db)
      .select(StandardIncomeTableRecord, 'standard_income_tables')
      .where(
        every(
          condition('id', '==', props.id),
          condition('user_id', '==', props.userId),
        ),
      )
      .limit(1)
      .build()
    const gradesFetchQuery = d1(db)
      .select(StandardIncomeGradeRecord, 'standard_income_grades')
      .where(condition('income_table_id', '==', props.id))
      .build()

    const queries = [tableFetchQuery, gradesFetchQuery]

    const [
      {
        results: [tableRecordRaw],
      },
      { results: gradesRecordRaw },
    ] = await db.batch(queries)

    const tableRecord = StandardIncomeTableRecord.safeParse(tableRecordRaw)
    const gradeRecords = z
      .array(StandardIncomeGradeRecord)
      .safeParse(gradesRecordRaw)

    if (!tableRecord.success || !gradeRecords.success) {
      return undefined
    }

    return makeStandardIncomeTableEntity({
      tableRecord: tableRecord.data,
      gradeRecords: gradeRecords.data,
    })
  }

export {
  getStandardIncomeTable,
  insertStandardIncomeTable,
  listStandardIncomeTables,
  updateStandardIncomeTableGrades,
  updateStandardIncomeTableName,
}
