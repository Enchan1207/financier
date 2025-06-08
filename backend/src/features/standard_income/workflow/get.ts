import type { ResultAsync } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { z } from 'zod'

import type { StandardIncomeTable } from '@/domains/standard_income'
import type { User } from '@/domains/user'
import { EntityNotFoundError } from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'

export const GetStandardIncomeTableSchema = z.object({ id: z.string().ulid() })
type GetStandardIncomeTableSchema = z.infer<typeof GetStandardIncomeTableSchema>

export interface GetStandardIncomeTableCommand {
  input: GetStandardIncomeTableSchema
  state: { user: User }
}

const getStandardIncomeTable = (effects: {
  getStandardIncomeTable: (props: {
    userId: User['id']
    id: StandardIncomeTable['id']
  }) => Promise<StandardIncomeTable | undefined>
}) =>
  fromSafePromise(async (command: GetStandardIncomeTableCommand) => {
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

    return ok(stored)
  })

type GetStandardIncomeTableWorkflow = (
  command: GetStandardIncomeTableCommand,
) => ResultAsync<StandardIncomeTable, EntityNotFoundError>

export const createStandardIncomeTableGetWorkflow =
  (effects: {
    getStandardIncomeTable: (props: {
      userId: User['id']
      id: StandardIncomeTable['id']
    }) => Promise<StandardIncomeTable | undefined>
  }): GetStandardIncomeTableWorkflow =>
  (command) =>
    ok(command).asyncAndThen(getStandardIncomeTable(effects))
