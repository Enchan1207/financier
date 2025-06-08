import type { Result, ResultAsync } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { z } from 'zod'

import type {
  StandardIncomeGrade,
  StandardIncomeTable,
} from '@/domains/standard_income'
import { createStandardIncomeTable } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import type { ValidationError } from '@/logic/errors'
import { EntityNotFoundError } from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'

export const UpdateStandardIncomeTableGradesSchema = z.object({
  id: z.string().ulid(),
  grades: z.array(
    z.object({
      threshold: z.number().int().min(0),
      standardIncome: z.number().int().min(0),
    }),
  ),
})
type UpdateStandardIncomeTableGradesSchema = z.infer<
  typeof UpdateStandardIncomeTableGradesSchema
>

export interface UpdateStandardIncomeTableGradesCommand {
  input: UpdateStandardIncomeTableGradesSchema
  state: { user: User }
}

interface TableGradesUpdateEvent {
  current: StandardIncomeTable
  update: { grades: StandardIncomeGrade[] }
}

const queryCurrentTable = (effects: {
  getStandardIncomeTable: (props: {
    userId: User['id']
    id: StandardIncomeTable['id']
  }) => Promise<StandardIncomeTable | undefined>
}) =>
  fromSafePromise(async (command: UpdateStandardIncomeTableGradesCommand) => {
    const {
      input: { id },
      state: {
        user: { id: userId },
      },
    } = command

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
  input: UpdateStandardIncomeTableGradesSchema
  state: {
    current: StandardIncomeTable
    user: User
  }
}

const validateGradesUpdate = ({
  input: { grades },
  state: { current },
}: CurrentTableQueried): Result<TableGradesUpdateEvent, ValidationError> =>
  createStandardIncomeTable({
    userId: current.userId,
    name: current.name,
    grades,
  }).map(({ grades }) => ({
    current,
    update: { grades },
  }))

type WorkflowError = EntityNotFoundError | ValidationError
type UpdateStandardIncomeTableGradesWorkflow = (
  command: UpdateStandardIncomeTableGradesCommand,
) => ResultAsync<TableGradesUpdateEvent, WorkflowError>

export const createStandardIncomeTableGradesUpdateWorkflow =
  (effects: {
    getStandardIncomeTable: (props: {
      userId: User['id']
      id: StandardIncomeTable['id']
    }) => Promise<StandardIncomeTable | undefined>
  }): UpdateStandardIncomeTableGradesWorkflow =>
  (command) =>
    ok(command)
      .asyncAndThen(queryCurrentTable(effects))
      .andThen(validateGradesUpdate)
