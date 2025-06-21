import { z } from 'zod'

import type {
  StandardIncomeGrade,
  StandardIncomeTable,
} from '@/domains/standard_income'

import { UlidSchema } from '../schema'

export const StandardIncomeTableRecord = z.object({
  id: UlidSchema,
  user_id: UlidSchema,
  name: z.string(),
})

export type StandardIncomeTableRecord = z.infer<
  typeof StandardIncomeTableRecord
>

export const StandardIncomeGradeRecord = z.object({
  income_table_id: UlidSchema,
  threshold: z.number().int().min(0),
  standard_income: z.number().int().min(0),
})

export type StandardIncomeGradeRecord = z.infer<
  typeof StandardIncomeGradeRecord
>

export const makeStandardIncomeRecord = (
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

export const makeStandardIncomeGradeEntity = (
  record: StandardIncomeGradeRecord,
) =>
  ({
    threshold: record.threshold,
    standardIncome: record.standard_income,
  }) as StandardIncomeGrade // recordを作成する前段階でドメインモデルになっているはずなので、asで問題ない

export const makeStandardIncomeTableEntity = (props: {
  tableRecord: StandardIncomeTableRecord
  gradeRecords: StandardIncomeGradeRecord[]
}): StandardIncomeTable => ({
  id: props.tableRecord.id,
  userId: props.tableRecord.user_id,
  name: props.tableRecord.name,
  grades: props.gradeRecords.map(makeStandardIncomeGradeEntity),
})
