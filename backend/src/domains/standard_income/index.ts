import { z } from 'zod'

import { EntityIdSchema, MoneySchema } from '@/domains/schema'

export const StandardIncomeGradeSchema = z.object({
  threshold: MoneySchema,
  standardIncome: MoneySchema,
})

export const StandardIncomeTableSchema = z.object({
  id: EntityIdSchema('standard_income_table'),
  userId: EntityIdSchema('user'),
  name: z.string().min(1),
  grades: z.array(StandardIncomeGradeSchema).min(1),
})

/** 標準報酬月額の等級 */
export type StandardIncomeGrade = z.infer<typeof StandardIncomeGradeSchema>

/** 標準報酬月額表 */
export type StandardIncomeTable = z.infer<typeof StandardIncomeTableSchema>

/** 標準報酬月額表 (サマリ) */
export type StandardIncomeTableSummary = Omit<StandardIncomeTable, 'grades'>
