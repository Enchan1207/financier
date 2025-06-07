import type { Result, ResultAsync } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { z } from 'zod'

import type { StandardIncomeTable } from '@/domains/standard_income'
import { createStandardIncomeTable } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import type { EntityAuthorizationError, ValidationError } from '@/logic/errors'
import { EntityNotFoundError } from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'

export const DuplicateStandardIncomeTableSchema = z.object({
  id: z.string().ulid(),
  name: z.string(),
})
type DuplicateStandardIncomeTableSchema =
z.infer<typeof DuplicateStandardIncomeTableSchema>

export interface DuplicateStandardIncomeTableCommand {
  input: DuplicateStandardIncomeTableSchema
  state: { user: User }
}

interface TableDuplicateEvent { entity: StandardIncomeTable }

const querySourceTable = (effects: {
  getStandardIncomeTable: (props: {
    userId: User['id']
    id: StandardIncomeTable['id']
  }) => Promise<StandardIncomeTable | undefined>
}) => fromSafePromise(async (command: DuplicateStandardIncomeTableCommand) => {
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

interface SourceTableQueried {
  input: DuplicateStandardIncomeTableSchema
  state: {
    current: StandardIncomeTable
    user: User
  }
}

const duplicateTable = (queried: SourceTableQueried): Result<TableDuplicateEvent, ValidationError> =>
  createStandardIncomeTable({
    userId: queried.state.user.id,
    name: queried.input.name,
    grades: queried.state.current.grades,
  }).map(entity => ({ entity }))

type WorkflowError =
  | EntityNotFoundError
  | EntityAuthorizationError
  | ValidationError
type DuplicateStandardIncomeTableWorkflow =
(command: DuplicateStandardIncomeTableCommand) => ResultAsync<TableDuplicateEvent, WorkflowError>

export const createStandardIncomeTableDuplicateWorkflow = (effects: {
  getStandardIncomeTable: (props: {
    userId: User['id']
    id: StandardIncomeTable['id']
  }) => Promise<StandardIncomeTable | undefined>
}): DuplicateStandardIncomeTableWorkflow => command =>
  ok(command)
    .asyncAndThen(querySourceTable(effects))
    .andThen(duplicateTable)
