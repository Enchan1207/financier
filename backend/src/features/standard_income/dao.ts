import { z } from 'zod'

import type {
  StandardIncomeGrade,
  StandardIncomeTable,
  StandardIncomeTableSummary,
} from '@/domains/standard_income'
import type { User } from '@/domains/user'
import { condition, every } from '@/logic/queryBuilder/conditionTree'
import { d1 } from '@/logic/queryBuilder/d1'

const StandardIncomeTableRecord = z.object({
  id: z.string().ulid(),
  user_id: z.string().ulid(),
  name: z.string(),
})

type StandardIncomeTableRecord = z.infer<typeof StandardIncomeTableRecord>

const StandardIncomeGradeRecord = z.object({
  income_table_id: z.string().ulid(),
  threshold: z.number().int().min(0),
  standard_income: z.number().int().min(0),
})

type StandardIncomeGradeRecord = z.infer<typeof StandardIncomeGradeRecord>

const makeRecord = (
  entity: StandardIncomeTable,
): [StandardIncomeTableRecord, StandardIncomeGradeRecord[]] => [
  {
    id: entity.id,
    user_id: entity.userId,
    name: entity.name,
  },
  entity.grades.map((grade) => ({
    income_table_id: entity.id,
    threshold: grade.threshold,
    standard_income: grade.standardIncome,
  })),
]

const makeGradeEntity = (record: StandardIncomeGradeRecord) =>
  ({
    threshold: record.threshold,
    standardIncome: record.standard_income,
  }) as StandardIncomeGrade // recordを作成する前段階でドメインモデルになっているはずなので、asで問題ない

const makeTableEntity = (props: {
  tableRecord: StandardIncomeTableRecord
  gradeRecords: StandardIncomeGradeRecord[]
}): StandardIncomeTable => ({
  id: props.tableRecord.id,
  userId: props.tableRecord.user_id,
  name: props.tableRecord.name,
  grades: props.gradeRecords.map(makeGradeEntity),
})

/** 新しい標準報酬月額表を追加 */
export const insertStandardIncomeTable =
  (
    db: D1Database,
  ): ((item: StandardIncomeTable) => Promise<StandardIncomeTable>) =>
  async (entity) => {
    const [tableRecord, gradeRecords] = makeRecord(entity)

    const tableInsertStmt =
      'INSERT INTO standard_income_tables VALUES (?1,?2,?3)'
    const tableInsertQuery = db
      .prepare(tableInsertStmt)
      .bind(tableRecord.id, tableRecord.user_id, tableRecord.name)

    const gradeInsertStmt =
      'INSERT INTO standard_income_grades VALUES (?1,?2,?3)'
    const gradeInsertQueries = gradeRecords.map((grade) =>
      db
        .prepare(gradeInsertStmt)
        .bind(tableRecord.id, grade.threshold, grade.standard_income),
    )

    const queries = [tableInsertQuery, ...gradeInsertQueries]
    await db.batch(queries)

    return entity
  }

/** 標準報酬月額表の名前を変更する */
export const updateStandardIncomeTableName =
  (
    db: D1Database,
  ): ((props: {
    userId: User['id']
    id: StandardIncomeTable['id']
    name: StandardIncomeTable['name']
  }) => Promise<StandardIncomeTableSummary | undefined>) =>
  async (props) => {
    const updateQueryBase =
      'UPDATE standard_income_tables SET name=? WHERE id=? AND user_id=?'
    const updateQuery = db
      .prepare(updateQueryBase)
      .bind(props.name, props.id, props.userId)

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
export const updateStandardIncomeTableGrades =
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

    const gradeInsertStmt =
      'INSERT INTO standard_income_grades VALUES (?1,?2,?3)'
    const gradeInsertQueries = gradeRecords.map((record) =>
      db
        .prepare(gradeInsertStmt)
        .bind(record.income_table_id, record.threshold, record.standard_income),
    )

    const gradeCleanupStmt =
      'DELETE from standard_income_grades WHERE income_table_id=?'
    const gradeCleanupQuery = db.prepare(gradeCleanupStmt).bind(props.id)

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
export const listStandardIncomeTables =
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
export const getStandardIncomeTable =
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

    return makeTableEntity({
      tableRecord: tableRecord.data,
      gradeRecords: gradeRecords.data,
    })
  }
