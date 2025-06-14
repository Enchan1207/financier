import type { Result } from 'neverthrow'
import { z } from 'zod'

import type { FinancialMonthData } from '@/domains/financial_month_context'
import { FinancialMonthDataSchema } from '@/domains/financial_month_context'
import type { IncomeDefinition } from '@/domains/income_definition'
import { IncomeDefinitionKind } from '@/domains/income_definition'
import { createIncomeDefinition } from '@/domains/income_definition/logic'
import type { User } from '@/domains/user'
import type { ValidationError } from '@/logic/errors'

export const PostIncomeDefinitionSchema = z.object({
  name: z.string(),
  kind: z.enum(IncomeDefinitionKind),
  value: z.number().int().min(0),
  isTaxable: z.boolean().default(true),
  from: FinancialMonthDataSchema,
  to: FinancialMonthDataSchema,
})
type PostIncomeDefinitionSchema = z.infer<typeof PostIncomeDefinitionSchema>

export interface PostIncomeDefinitionCommand {
  input: {
    name: string
    kind: IncomeDefinitionKind
    value: number
    isTaxable: boolean
    from: FinancialMonthData
    to: FinancialMonthData
  }
  state: { user: User }
}

export interface IncomeDefinitionRegistrationEvent {
  entity: IncomeDefinition
}

const createRegistrationEvent = (
  command: PostIncomeDefinitionCommand,
): Result<IncomeDefinitionRegistrationEvent, ValidationError> =>
  createIncomeDefinition({
    ...command.input,
    userId: command.state.user.id,
  }).map((entity) => ({ entity }))

type PostIncomeDefinitionWorkflow = (
  command: PostIncomeDefinitionCommand,
) => Result<IncomeDefinitionRegistrationEvent, ValidationError>

// もはやワークフローにするまでもないね……
export const createIncomeDefinitionPostWorkflow =
  (): PostIncomeDefinitionWorkflow => (command) =>
    createRegistrationEvent(command)
