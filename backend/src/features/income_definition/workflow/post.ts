import { ok, Result } from 'neverthrow'
import { z } from 'zod'

import type { FinancialMonthData } from '@/domains/financial_month'
import { FinancialMonthDataSchema } from '@/domains/financial_month'
import { validateFinancialMonthData } from '@/domains/financial_month/logic'
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

export interface UnvalidatedPostIncomeDefinitionCommand {
  input: PostIncomeDefinitionSchema
  state: { user: User }
}

interface ValidatedPostIncomeDefinitionCommand {
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

export interface IncomeDefinitionRegistrationEvent { entity: IncomeDefinition }

const validateCommand = (command: UnvalidatedPostIncomeDefinitionCommand):
Result<ValidatedPostIncomeDefinitionCommand, ValidationError> => {
  const {
    input: {
      name, kind, value, isTaxable, from: fromRaw, to: toRaw,
    }, state,
  } = command

  return Result
    .combine([fromRaw, toRaw].map(validateFinancialMonthData))
    .map(([from, to]) => ({
      input: {
        name,
        kind,
        value,
        isTaxable,
        from,
        to,
      },
      state,
    }))
}

const createRegistrationEvent = (command: ValidatedPostIncomeDefinitionCommand): Result<IncomeDefinitionRegistrationEvent, ValidationError> =>
  createIncomeDefinition({
    ...command.input,
    userId: command.state.user.id,
  }).map(entity => ({ entity }))

type PostIncomeDefinitionWorkflow = (command: UnvalidatedPostIncomeDefinitionCommand) => Result<IncomeDefinitionRegistrationEvent, ValidationError>

export const createIncomeDefinitionPostWorkflow = (): PostIncomeDefinitionWorkflow => command =>
  ok(command)
    .andThen(validateCommand)
    .andThen(createRegistrationEvent)
