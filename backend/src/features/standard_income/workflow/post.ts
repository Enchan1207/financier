import type { Result } from 'neverthrow'
import { ok } from 'neverthrow'
import { z } from 'zod'

import type { StandardIncomeTable } from '@/domains/standard_income'
import { createStandardIncomeTable } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import type { ValidationError } from '@/logic/errors'

export const PostStandardIncomeTableSchema = z.object({
  name: z.string(),
  grades: z.array(
    z.object({
      threshold: z.number().int().min(0),
      standardIncome: z.number().int().min(0),
    }),
  ),
})
type PostStandardIncomeTableSchema = z.infer<
  typeof PostStandardIncomeTableSchema
>

export interface PostStandardIncomeTableCommand {
  input: PostStandardIncomeTableSchema
  state: { user: User }
}

interface TableRegistrationEvent {
  entity: StandardIncomeTable
}

const createRegistrationEvent = (
  command: PostStandardIncomeTableCommand,
): Result<TableRegistrationEvent, ValidationError> =>
  createStandardIncomeTable({
    userId: command.state.user.id,
    name: command.input.name,
    grades: command.input.grades,
  }).map((entity) => ({ entity }))

type PostStandardIncomeTableWorkflow = (
  command: PostStandardIncomeTableCommand,
) => Result<TableRegistrationEvent, ValidationError>

export const createStandardIncomeTablePostWorkflow =
  (): PostStandardIncomeTableWorkflow => (command) =>
    ok(command).andThen(createRegistrationEvent)
