import type { ResultAsync } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { z } from 'zod'

import type { FinancialMonthData } from '@/domains/financial_month_context'
import { FinancialMonthDataSchema } from '@/domains/financial_month_context'
import type { IncomeDefinition } from '@/domains/income_definition'
import { IncomeDefinitionKind } from '@/domains/income_definition'
import type { User } from '@/domains/user'
import type { ValidationError } from '@/logic/errors'
import { EntityNotFoundError } from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'

export const PutIncomeDefinitionQuerySchema = z.object({
  id: z.string().ulid(),
})
type PutIncomeDefinitionQuerySchema = z.infer<
  typeof PutIncomeDefinitionQuerySchema
>

export const PutIncomeDefinitionBodySchema = z.object({
  name: z.string().optional(),
  kind: z.enum(IncomeDefinitionKind).optional(),
  value: z.number().int().min(0).optional(),
  isTaxable: z.boolean().optional(),
  from: FinancialMonthDataSchema.optional(),
  to: FinancialMonthDataSchema.optional(),
})
type PutIncomeDefinitionBodySchema = z.infer<
  typeof PutIncomeDefinitionBodySchema
>

export interface PutIncomeDefinitionCommand {
  input: {
    name?: string
    kind?: IncomeDefinitionKind
    value?: number
    isTaxable?: boolean
    from?: FinancialMonthData
    to?: FinancialMonthData
  }
  state: {
    id: IncomeDefinition['id']
    user: User
  }
}

interface CurrentDefinitionQueried {
  input: {
    name?: string
    kind?: IncomeDefinitionKind
    value?: number
    isTaxable?: boolean
    from?: FinancialMonthData
    to?: FinancialMonthData
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

const queryCurrentDefinition = (
  effects: Pick<WorkflowEffects, 'getIncomeDefinitionById'>,
) =>
  fromSafePromise(async (command: PutIncomeDefinitionCommand) => {
    const {
      state: { id },
      state: {
        user: { id: userId },
      },
    } = command

    const stored = await effects.getIncomeDefinitionById(userId, id)
    if (stored === undefined) {
      return err(new EntityNotFoundError({ id }))
    }

    return ok({
      input: command.input,
      state: {
        current: stored,
        user: command.state.user,
      },
    })
  })

const createUpdateEvent = (
  command: CurrentDefinitionQueried,
): IncomeDefinitionUpdateEvent => {
  const {
    input,
    state: { current },
  } = command

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

type IncomeDefinitionPutWorkflow = (
  command: PutIncomeDefinitionCommand,
) => ResultAsync<
  IncomeDefinitionUpdateEvent,
  EntityNotFoundError | ValidationError
>

type WorkflowEffects = {
  getIncomeDefinitionById: (
    userId: string,
    id: string,
  ) => Promise<IncomeDefinition | undefined>
}

export const createIncomeDefinitionPutWorkflow =
  (effects: WorkflowEffects): IncomeDefinitionPutWorkflow =>
  (command) =>
    ok(command)
      .asyncAndThen(queryCurrentDefinition(effects))
      .map(createUpdateEvent)
