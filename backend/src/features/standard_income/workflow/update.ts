import { err, ok, Result } from 'neverthrow'

import type { StandardIncomeGrade } from '@/domains/standard_income'
import { createStandardIncomeGrade } from '@/domains/standard_income/logic'
import type { User } from '@/domains/user'
import { ValidationError } from '@/logic/errors'

export interface UpdateStandardIncomeTableCommand {
  input: {
    id: string
    name?: string
    grades?: {
      threshold: number
      standardIncome: number
    }[]
  }
  state: {
    user: User
  }
}

interface ValidatedCommand {
  input: {
    id: string
  } & (
    | {
        kind: 'name'
        name: string
      }
    | {
        kind: 'grades'
        grades: StandardIncomeGrade[]
      }
  )
  state: {
    user: User
  }
}

interface UpdateEventBase {
  id: string
  userId: string
}

interface NameUpdateEvent extends UpdateEventBase {
  kind: 'name'
  name: string
}

interface GradesUpdateEvent extends UpdateEventBase {
  kind: 'grades'
  grades: StandardIncomeGrade[]
}

type UpdateEvent = NameUpdateEvent | GradesUpdateEvent

const validateCommand = ({
  input,
  state,
}: UpdateStandardIncomeTableCommand): Result<
  ValidatedCommand,
  ValidationError
> => {
  // いずれか一方しか更新できない
  if (input.name !== undefined && input.grades !== undefined) {
    return err(
      new ValidationError('複数のプロパティを同時に更新することはできません。'),
    )
  }

  if (input.name !== undefined) {
    return ok({
      input: {
        id: input.id,
        kind: 'name',
        name: input.name,
      },
      state,
    })
  }

  if (input.grades !== undefined) {
    return Result.combine(input.grades.map(createStandardIncomeGrade)).map(
      (grades) => ({
        input: {
          id: input.id,
          kind: 'grades',
          grades,
        },
        state,
      }),
    )
  }

  // いずれも更新しないことはできない
  return err(
    new ValidationError(
      '更新対象のプロパティがリクエストボディに含まれていません',
    ),
  )
}

const createEvent = ({ input, state }: ValidatedCommand): UpdateEvent => {
  if (input.kind === 'grades') {
    return {
      id: input.id,
      userId: state.user.id,
      kind: 'grades',
      grades: input.grades,
    }
  }

  return {
    id: input.id,
    userId: state.user.id,
    kind: 'name',
    name: input.name,
  }
}

export const createStandardIncomeTableUpdateWorkflow =
  (): ((
    command: UpdateStandardIncomeTableCommand,
  ) => Result<UpdateEvent, ValidationError>) =>
  (command) =>
    ok(command) //
      .andThen(validateCommand)
      .map(createEvent)
