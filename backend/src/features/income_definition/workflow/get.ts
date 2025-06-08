import type { ResultAsync } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { z } from 'zod'

import type { IncomeDefinition } from '@/domains/income_definition'
import type { User } from '@/domains/user'
import { EntityNotFoundError } from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'

export const GetIncomeDefinitionSchema = z.object({ id: z.string().ulid() })
type GetIncomeDefinitionSchema = z.infer<typeof GetIncomeDefinitionSchema>

export interface GetIncomeDefinitionCommand {
  input: GetIncomeDefinitionSchema
  state: { user: User }
}

const getIncomeDefinition = (effects: Pick<WorkflowEffects, 'getIncomeDefinitionById'>) => fromSafePromise(async (command: GetIncomeDefinitionCommand) => {
  const { input: { id }, state: { user: { id: userId } } } = command

  const stored = await effects.getIncomeDefinitionById(userId, id)
  if (stored === undefined) {
    return err(new EntityNotFoundError({ id }))
  }

  return ok(stored)
})

type WorkflowEffects = {
  //
  getIncomeDefinitionById: (userId: string, id: string) => Promise<IncomeDefinition | undefined>
}

type GetIncomeDefinitionWorkflow = (command: GetIncomeDefinitionCommand) => ResultAsync<IncomeDefinition, EntityNotFoundError>

export const createIncomeDefinitionGetWorkflow = (effects: WorkflowEffects): GetIncomeDefinitionWorkflow => command =>
  ok(command)
    .asyncAndThen(getIncomeDefinition(effects))
