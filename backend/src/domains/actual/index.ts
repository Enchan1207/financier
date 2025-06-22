import { z } from 'zod'

import { EntityIdSchema, MoneySchema, TimestampSchema } from '../schema'

export const ActualSchema = z.object({
  userId: EntityIdSchema('user'),
  monthlyContextId: EntityIdSchema('monthly_context'),
  definitionId: EntityIdSchema('definition'),
  value: MoneySchema,
  updatedAt: TimestampSchema,
})

export type Actual = z.infer<typeof ActualSchema>
