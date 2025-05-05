import type { ResultAsync } from 'neverthrow'
import { z } from 'zod'

import { FinancialMonthDataSchema } from '@/domains/financial_month'
import type { IncomeDefinition } from '@/domains/income_definition'
import { IncomeDefinitionKind } from '@/domains/income_definition'
import type { User } from '@/domains/user'
import type {
  EntityAuthorizationError, EntityNotFoundError, ValidationError,
} from '@/logic/errors'

export const PutIncomeDefinitionQuerySchema = z.object({
  //
  id: z.string().ulid(),
})
type PutIncomeDefinitionQuerySchema =
z.infer<typeof PutIncomeDefinitionQuerySchema>

export const PutIncomeDefinitionBodySchema = z.object({
  name: z.string().optional(),
  kind: z.enum(IncomeDefinitionKind).optional(),
  value: z.number().int().min(0).optional(),
  isTaxable: z.boolean().optional(),
  from: FinancialMonthDataSchema,
  to: FinancialMonthDataSchema,
})
type PutIncomeDefinitionBodySchema =
z.infer<typeof PutIncomeDefinitionBodySchema>

export interface UnvalidatedPutIncomeDefinitionCommand {
  input: PutIncomeDefinitionBodySchema
  state: PutIncomeDefinitionQuerySchema & { user: User }
}

export interface IncomeDefinitionUpdateEvent {
  //
  entity: IncomeDefinition
}

// --

type IncomeDefinitionPutWorkflow = (command: UnvalidatedPutIncomeDefinitionCommand) => ResultAsync<IncomeDefinitionUpdateEvent, EntityNotFoundError | EntityAuthorizationError | ValidationError>

export const createIncomeDefinitionPutWorkflow = (effects: {
  //
  getIncomeDefinitionById: (id: string) => Promise<IncomeDefinition | undefined>
}): IncomeDefinitionPutWorkflow => command =>
  ok(command)
