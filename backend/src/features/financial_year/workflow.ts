import type { Result, ResultAsync } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { z } from 'zod'

import { getFinancialMonthFromDate } from '@/domains/financial_month/logic'
import type { FinancialYear, FinancialYearValue } from '@/domains/financial_year'
import { FinancialYearValueSchema } from '@/domains/financial_year'
import { createFinancialYear } from '@/domains/financial_year/logic'
import type { User } from '@/domains/user'
import dayjs from '@/logic/dayjs'
import { ValidationError } from '@/logic/errors'
import { fromSafePromise } from '@/logic/neverthrow'

export const PostFinancialYearSchema = z.object({
  //
  year: FinancialYearValueSchema,
})
type PostFinancialYearSchema = z.infer<typeof PostFinancialYearSchema>

export interface PostFinancialYearCommand {
  input: { year: FinancialYearValue }
  state: { user: User }
}

interface LatestFinancialYearQueried {
  input: { year: FinancialYearValue }
  state: {
    user: User
    latestFinancialYear: FinancialYearValue | undefined
  }
}

interface ContinuityChecked {
  input: { year: FinancialYearValue }
  state: { user: User }
}

export interface FinancialYearPostEvent { entity: FinancialYear }

const queryLatestFinancialYear = (effects: {
  //
  listFinancialYears: (props: {
    userId: User['id']
    order?: 'asc' | 'desc'
  }) => Promise<FinancialYearValue[]>
}) => fromSafePromise(async (command: PostFinancialYearCommand) => {
  const financialYears = await effects.listFinancialYears({
    userId: command.state.user.id,
    order: 'desc',
  })
  const latestFinancialYear = financialYears.at(0)

  return ok({
    input: { year: command.input.year },
    state: {
      user: command.state.user,
      latestFinancialYear,
    },
  })
})

const checkContinuity = (command: LatestFinancialYearQueried): Result<ContinuityChecked, ValidationError> => {
  if (command.state.latestFinancialYear === undefined) {
    const currentFinancialMonth = getFinancialMonthFromDate(dayjs())
    if (currentFinancialMonth === undefined) {
      return err(new ValidationError('failed to get current financial month'))
    }

    const expected = currentFinancialMonth.financialYear
    if (command.input.year !== expected) {
      return err(new ValidationError('only current financial year can be created when no any entities exist.'))
    }

    return ok({
      input: { year: command.input.year },
      state: { user: command.state.user },
    })
  }

  const latestYear = command.state.latestFinancialYear
  if (command.input.year - 1 !== latestYear) {
    return err(new ValidationError(`financial year must keep continuity (latest: ${latestYear} specified: ${command.input.year})`))
  }

  return ok({
    input: { year: command.input.year },
    state: { user: command.state.user },
  })
}

const createPostEvent = (command: ContinuityChecked): Result<FinancialYearPostEvent, ValidationError> => createFinancialYear({
  userId: command.state.user.id,
  year: command.input.year,
}).map(entity => ({ entity }))

type FinancialYearPostWorkflow = (command: PostFinancialYearCommand) => ResultAsync<FinancialYearPostEvent, ValidationError>

export const createFinancialYearPostWorkflow = (effects: {
  //
  listFinancialYears: (props: {
    userId: User['id']
    order?: 'asc' | 'desc'
  }) => Promise<FinancialYearValue[]>
}): FinancialYearPostWorkflow => command =>
  ok(command)
    .asyncAndThen(queryLatestFinancialYear(effects))
    .andThen(checkContinuity)
    .andThen(createPostEvent)
