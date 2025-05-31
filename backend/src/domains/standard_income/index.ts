import { z } from 'zod'

export const StandardIncomeGradeSchema = z.object({
  threshold: z.number().int().positive(),
  standardIncome: z.number().int().positive(),
}).brand()

export const StandardIncomeTableSchema = z.object({
  id: z.string().ulid(),
  userId: z.string().ulid(),
  name: z.string(),
  grades: z.array(StandardIncomeGradeSchema),
})

/** 標準報酬月額の等級 */
export type StandardIncomeGrade = z.infer<typeof StandardIncomeGradeSchema>

/** 標準報酬月額表 */
export type StandardIncomeTable = z.infer<typeof StandardIncomeTableSchema>

/** 標準報酬月額表 (サマリ) */
export type StandardIncomeTableSummary = Omit<StandardIncomeTable, 'grades'>
