import type { ResultAsync } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { z } from 'zod'

import type { IncomeDefinition } from '@/domains/income_definition'
import type { User } from '@/domains/user'
import { EntityAuthorizationError, EntityNotFoundError } from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'

export const GetIncomeDefinitionSchema = z.object({ id: z.string().ulid() })
type GetIncomeDefinitionSchema = z.infer<typeof GetIncomeDefinitionSchema>

export interface GetIncomeDefinitionCommand {
  input: GetIncomeDefinitionSchema
  state: { user: User }
}

const getIncomeDefinition = (effects: {
  //
  getIncomeDefinitionById: (id: string) => Promise<IncomeDefinition | undefined>
}) => fromSafePromise(async (command: GetIncomeDefinitionCommand) => {
  const { input: { id }, state: { user: { id: userId } } } = command

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

  return ok(stored)
})

type GetIncomeDefinitionWorkflow = (command: GetIncomeDefinitionCommand) => ResultAsync<IncomeDefinition, EntityNotFoundError | EntityAuthorizationError>

export const createIncomeDefinitionGetWorkflow = (effects: {
  //
  getIncomeDefinitionById: (id: string) => Promise<IncomeDefinition | undefined>
}): GetIncomeDefinitionWorkflow => command =>
  ok(command)
    .asyncAndThen(getIncomeDefinition(effects))
