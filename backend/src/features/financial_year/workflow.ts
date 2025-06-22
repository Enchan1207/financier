import type { Result, ResultAsync } from 'neverthrow'
import { err, ok } from 'neverthrow'

import type {
  FinancialYear,
  FinancialYearValue,
} from '@/domains/financial_year'
import { FinancialYearValueSchema } from '@/domains/financial_year'
import { createFinancialYear } from '@/domains/financial_year/logic'
import { getFinancialMonthFromDate } from '@/domains/monthly_context/logic'
import type { EntityId } from '@/domains/schema'
import type { User } from '@/domains/user'
import dayjs from '@/logic/dayjs'
import { ValidationError } from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'
import { parseSchema } from '@/logic/zod'

export interface PostFinancialYearCommand {
  input: {
    year: number
    standardIncomeTableId: EntityId<'standard_income_table'>
  }
  state: {
    user: User
  }
}

interface ValidatedCommand {
  input: {
    year: FinancialYearValue
    standardIncomeTableId: EntityId<'standard_income_table'>
  }
  state: {
    user: User
  }
}

interface LatestFinancialYearQueried {
  input: {
    year: FinancialYearValue
    standardIncomeTableId: EntityId<'standard_income_table'>
  }
  state: {
    user: User
    latestFinancialYear: FinancialYearValue | undefined
  }
}

interface ContinuityChecked {
  input: {
    year: FinancialYearValue
    standardIncomeTableId: EntityId<'standard_income_table'>
  }
  state: {
    user: User
  }
}

export interface FinancialYearPostEvent {
  entity: FinancialYear
}

const validateCommand = ({
  input,
  state,
}: PostFinancialYearCommand): Result<ValidatedCommand, ValidationError> =>
  parseSchema(FinancialYearValueSchema, input.year).map((year) => ({
    input: {
      year,
      standardIncomeTableId: input.standardIncomeTableId,
    },
    state,
  }))

const queryLatestFinancialYear = (effects: {
  listFinancialYears: (props: {
    userId: User['id']
    order?: 'asc' | 'desc'
  }) => Promise<FinancialYearValue[]>
}) =>
  fromSafePromise(async ({ input, state }: ValidatedCommand) => {
    const financialYears = await effects.listFinancialYears({
      userId: state.user.id,
      order: 'desc',
    })
    const latestFinancialYear = financialYears.at(0)

    return ok({
      input,
      state: {
        user: state.user,
        latestFinancialYear,
      },
    })
  })

const checkContinuity = ({
  input,
  state,
}: LatestFinancialYearQueried): Result<ContinuityChecked, ValidationError> => {
  if (state.latestFinancialYear === undefined) {
    const currentFinancialMonth = getFinancialMonthFromDate(dayjs())
    if (currentFinancialMonth === undefined) {
      return err(new ValidationError('failed to get current financial month'))
    }

    const expected = currentFinancialMonth.financialYear
    if (input.year !== expected) {
      return err(
        new ValidationError(
          'only current financial year can be created when no any entities exist.',
        ),
      )
    }

    return ok({
      input,
      state: { user: state.user },
    })
  }

  const latestYear = state.latestFinancialYear
  if (input.year - 1 !== latestYear) {
    return err(
      new ValidationError(
        `financial year must keep continuity (latest: ${latestYear} specified: ${input.year})`,
      ),
    )
  }

  return ok({
    input,
    state: { user: state.user },
  })
}

const createPostEvent = (
  command: ContinuityChecked,
): Result<FinancialYearPostEvent, ValidationError> =>
  createFinancialYear({
    userId: command.state.user.id,
    financialYear: command.input.year,
    standardIncomeTableId: command.input.standardIncomeTableId,
  }).map((entity) => ({ entity }))

type FinancialYearPostWorkflow = (
  command: PostFinancialYearCommand,
) => ResultAsync<FinancialYearPostEvent, ValidationError>

export const createFinancialYearPostWorkflow =
  (effects: {
    listFinancialYears: (props: {
      userId: User['id']
      order?: 'asc' | 'desc'
    }) => Promise<FinancialYearValue[]>
  }): FinancialYearPostWorkflow =>
  (command) =>
    ok(command)
      .andThen(validateCommand)
      .asyncAndThen(queryLatestFinancialYear(effects))
      .andThen(checkContinuity)
      .andThen(createPostEvent)
