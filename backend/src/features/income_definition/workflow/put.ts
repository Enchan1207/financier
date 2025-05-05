import type { ResultAsync } from 'neverthrow'
import {
  err, ok, Result,
} from 'neverthrow'
import { z } from 'zod'

import type { FinancialMonthData } from '@/domains/financial_month'
import { FinancialMonthDataSchema } from '@/domains/financial_month'
import { validateFinancialMonthData } from '@/domains/financial_month/logic'
import type { IncomeDefinition } from '@/domains/income_definition'
import { IncomeDefinitionKind } from '@/domains/income_definition'
import type { User } from '@/domains/user'
import type { ValidationError } from '@/logic/errors'
import {
  EntityAuthorizationError,
  EntityNotFoundError,
} from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'

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

interface ValidatedPutIncomeDefinitionCommand {
  input: {
    name: string | undefined
    kind: IncomeDefinitionKind | undefined
    value: number | undefined
    isTaxable: boolean | undefined
    from: FinancialMonthData | undefined
    to: FinancialMonthData | undefined
  }
  state: {
    id: IncomeDefinition['id']
    user: User
  }
}

interface CurrentDefinitionQueried {
  input: {
    name: string | undefined
    kind: IncomeDefinitionKind | undefined
    value: number | undefined
    isTaxable: boolean | undefined
    from: FinancialMonthData | undefined
    to: FinancialMonthData | undefined
  }
  state: {
    current: IncomeDefinition
    user: User
  }
}

export interface IncomeDefinitionUpdateEvent {
  current: IncomeDefinition
  update: {
    name: string | undefined
    kind: IncomeDefinitionKind | undefined
    value: number | undefined
    isTaxable: boolean | undefined
    from: FinancialMonthData | undefined
    to: FinancialMonthData | undefined
  }
}

const validateCommand = (command: UnvalidatedPutIncomeDefinitionCommand):
Result<ValidatedPutIncomeDefinitionCommand, ValidationError> => {
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

const queryCurrentDefinition = (effects: {
  //
  getIncomeDefinitionById: (id: string) => Promise<IncomeDefinition | undefined>
}) => fromSafePromise(async (command: ValidatedPutIncomeDefinitionCommand) => {
  const { state: { id }, state: { user: { id: userId } } } = command

  const stored = await effects.getIncomeDefinitionById(id)
  if (stored === undefined) {
    return err(new EntityNotFoundError({ id }))
  }

  if (stored.userId !== userId) {
    return err(new EntityAuthorizationError({
      id,
      userId,
    }))
  }

  return ok({
    input: command.input,
    state: {
      current: stored,
      user: command.state.user,
    },
  })
})

const createUpdateEvent = (command: CurrentDefinitionQueried): IncomeDefinitionUpdateEvent => {
  const { input, state: { current } } = command

  return {
    current,
    update: {
      name: input.name,
      kind: input.kind,
      value: input.value,
      isTaxable: input.isTaxable,
      from: input.from,
      to: input.to,
    },
  }
}

type IncomeDefinitionPutWorkflow = (command: UnvalidatedPutIncomeDefinitionCommand) => ResultAsync<IncomeDefinitionUpdateEvent, EntityNotFoundError | EntityAuthorizationError | ValidationError>

export const createIncomeDefinitionPutWorkflow = (effects: {
  //
  getIncomeDefinitionById: (id: string) => Promise<IncomeDefinition | undefined>
}): IncomeDefinitionPutWorkflow => command =>
  ok(command)
    .andThen(validateCommand)
    .asyncAndThen(queryCurrentDefinition(effects))
    .map(createUpdateEvent)
