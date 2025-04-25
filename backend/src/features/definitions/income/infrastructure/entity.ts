import { z } from 'zod'

import { IncomeDefinitionKind } from '../domain/entity'

export const IncomeDefinitionRecord = z.object({
  id: z.string(),
  user_id: z.string(),
  kind: z.enum(IncomeDefinitionKind),
  value: z.number(),
  enabled_at: z.number(),
  disabled_at: z.number(),
  updated_at: z.number(),
})

export type IncomeDefinitionRecord = z.infer<typeof IncomeDefinitionRecord>
