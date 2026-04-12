import type { FiscalYear } from '@backend/domains/fiscal-year'
import type { UserId } from '@backend/domains/user'
import { Result } from '@praha/byethrow'

import { FiscalYearNotFoundException } from '../exceptions'

// MARK: command

export type CloseFiscalYearCommand = {
  input: {
    year: number
  }
  context: {
    userId: UserId
  }
}

// MARK: event

export type FiscalYearClosedEvent = {
  fiscalYear: FiscalYear
}

// MARK: effects

type Effects = {
  findFiscalYearByYear: (
    userId: UserId,
    year: number,
  ) => Promise<FiscalYear | undefined>
}

// MARK: workflow type

type Workflow = (
  command: CloseFiscalYearCommand,
) => Result.ResultAsync<FiscalYearClosedEvent, FiscalYearNotFoundException>

// MARK: steps

const resolveFiscalYear =
  (effects: Effects) =>
  async (
    command: CloseFiscalYearCommand,
  ): Result.ResultAsync<FiscalYearClosedEvent, FiscalYearNotFoundException> => {
    const fiscalYear = await effects.findFiscalYearByYear(
      command.context.userId,
      command.input.year,
    )

    if (!fiscalYear) {
      return Result.fail(
        new FiscalYearNotFoundException(
          `年度${command.input.year}が見つかりません`,
        ),
      )
    }

    return Result.succeed({
      fiscalYear: {
        ...fiscalYear,
        status: 'closed' as const,
      },
    })
  }

// MARK: definition

export const buildCloseFiscalYearWorkflow =
  (effects: Effects): Workflow =>
  (command) =>
    Result.pipe(
      Result.succeed(command),
      Result.andThen(resolveFiscalYear(effects)),
    )
