import { z } from 'zod'

export const StandardIncomeDataSchema = z.object({
  tableId: z.string().ulid(),
  min: z.number().int().positive(),
  value: z.number().int().positive(),
})

/** 標準報酬月額情報 */
export type StandardIncomeData =
  z.infer<typeof StandardIncomeDataSchema>

/** 標準報酬月額 */
export type StandardIncome = StandardIncomeData & {
  id: string
  userId: string
}
