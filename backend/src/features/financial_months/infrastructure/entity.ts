import { z } from 'zod'

export const FinancialMonthRecord = z.object({
  id: z.string(),
  user_id: z.string(),
  financial_year: z.number(),
  month: z.number(),
  started_at: z.number(),
  ended_at: z.number(),
})

export type FinancialMonthRecord = z.infer<typeof FinancialMonthRecord>
