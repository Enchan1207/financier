import { z } from 'zod'

import { FinancialYearValueSchema } from '../financial_year'
import { MonthsSchema } from '../monthly_context'
import { EntityIdSchema, MoneySchema } from '../schema'

export const ActualSchema = z.object({
  id: EntityIdSchema('actual'),
  userId: EntityIdSchema('user'),
  financialYear: FinancialYearValueSchema,
  month: MonthsSchema,
  definitionId: EntityIdSchema('definition'),
  value: MoneySchema,
})

export type Actual = z.infer<typeof ActualSchema>
