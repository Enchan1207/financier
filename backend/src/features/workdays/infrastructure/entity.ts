import { z } from 'zod'

export const WorkdayRecord = z.object({
  id: z.string(),
  user_id: z.string(),
  financial_month_id: z.number(),
  count: z.number(),
  updated_at: z.number(),
})

export type WorkdayRecord = z.infer<typeof WorkdayRecord>
