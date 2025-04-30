import { z } from 'zod'

import { IncomeRecordUpdator } from '../domain/entity'

// 草
export const IncomeRecordRecord = z.object({
  user_id: z.string(),

  financial_month_id: z.string(),
  definition_id: z.string(),

  value: z.number(),

  updated_at: z.number(),
  updated_by: z.enum(IncomeRecordUpdator),
})

export type IncomeRecordRecord = z.infer<typeof IncomeRecordRecord>
