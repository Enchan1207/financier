import type { ResultAsync } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { z } from 'zod'

import type { StandardIncomeTable } from '@/domains/standard_income'
import type { User } from '@/domains/user'
import { EntityNotFoundError } from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'

export const UpdateStandardIncomeTableNameSchema = z.object({
  id: z.string().ulid(),
  name: z.string(),
})
type UpdateStandardIncomeTableNameSchema =
z.infer<typeof UpdateStandardIncomeTableNameSchema>

export interface UpdateStandardIncomeTableNameCommand {
  input: UpdateStandardIncomeTableNameSchema
  state: { user: User }
}

interface TableNameUpdateEvent {
  current: StandardIncomeTable
  update: { name: string }
}

const queryCurrentTable = (effects: {
  getStandardIncomeTable: (props: {
    userId: User['id']
    id: StandardIncomeTable['id']
  }) => Promise<StandardIncomeTable | undefined>
}) => fromSafePromise(async (command: UpdateStandardIncomeTableNameCommand) => {
  const { input: { id }, state: { user: { id: userId } } } = command

  const stored = await effects.getStandardIncomeTable({
    userId,
    id,
  })
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

interface CurrentTableQueried {
  input: UpdateStandardIncomeTableNameSchema
  state: {
    current: StandardIncomeTable
    user: User
  }
}

const updateTableName = ({ input: { name }, state: { current } }:
CurrentTableQueried): TableNameUpdateEvent => ({
  current,
  update: { name },
})

type UpdateStandardIncomeTableNameWorkflow =
(command: UpdateStandardIncomeTableNameCommand) =>
ResultAsync<TableNameUpdateEvent, EntityNotFoundError>

export const createStandardIncomeTableNameUpdateWorkflow = (effects: {
  getStandardIncomeTable: (props: {
    userId: User['id']
    id: StandardIncomeTable['id']
  }) => Promise<StandardIncomeTable | undefined>
}): UpdateStandardIncomeTableNameWorkflow => command =>
  ok(command)
    .asyncAndThen(queryCurrentTable(effects))
    .map(updateTableName)
