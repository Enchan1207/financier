import type { ResultAsync } from 'neverthrow'
import {
  err, ok, Result,
} from 'neverthrow'
import { z } from 'zod'

import type { FinancialMonthData } from '@/domains/financial_month'
import { validateFinancialMonthData } from '@/domains/financial_month/logic'
import type { IncomeDefinition } from '@/domains/income_definition'
import { IncomeDefinitionKind } from '@/domains/income_definition'
import type { User } from '@/domains/user'
import { ValidationError } from '@/logic/errors'

import type { IncomeDefinitionFindCondition, IncomeDefinitionFindPeriod } from '../dao'
import { IncomeDefinitionSortKey } from '../dao'

export const ListIncomeDefinitionSchema = z.object({
  sortBy: z.enum(IncomeDefinitionSortKey).optional().default('updatedAt'),
  limit: z.string().pipe(z.coerce.number().min(0).int()).default('20'),
  offset: z.string().pipe(z.coerce.number().min(0).int()).optional(),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  kind: z.enum(IncomeDefinitionKind).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  at: z.string().optional(),
})
type ListIncomeDefinitionSchema = z.infer<typeof ListIncomeDefinitionSchema>

export interface UnvalidatedListIncomeDefinitionCommand {
  input: ListIncomeDefinitionSchema
  state: { user: User }
}

interface ValidatedListIncomeDefinitionCommand {
  input: {
    sortBy: IncomeDefinitionSortKey
    limit: number
    offset: number | undefined
    order: 'asc' | 'desc'
    kind: IncomeDefinitionKind | undefined
    period?: IncomeDefinitionFindPeriod
  }
  state: { user: User }
}

const parsePeriodString = (periodRaw: string): Result<{
  financialYear: number
  month: number | undefined
}, ValidationError> => {
  const pattern = /(?<yearRaw>\d{4})(_(?<monthRaw>\d{2}))?/
  const groups = periodRaw.match(pattern)?.groups
  if (groups === undefined) {
    return err(new ValidationError())
  }

  const { yearRaw, monthRaw } = groups
  return ok({
    financialYear: Number(yearRaw),
    month: monthRaw ? Number(monthRaw) : undefined,
  })
}

// TODO: ドメインモデル"会計年度"を定義するタイミングでそっちに移動するか?
const validateFinancialYear = (financialYear: number): Result<number, ValidationError> =>
  financialYear > 0 ? ok(financialYear) : err(new ValidationError())

const validatePeriod = (parsed: {
  financialYear: number
  month: number | undefined
}): Result<number | FinancialMonthData, ValidationError> =>
  ok(parsed)
    .andThen(({ financialYear, month }) =>
      month
        ? validateFinancialMonthData({
            financialYear,
            month,
          })
        : validateFinancialYear(financialYear))

const buildPeriod = (props: {
  from: string | undefined
  to: string | undefined
  at: string | undefined
}) => ok(props)
  .andThen(({
    from, to, at,
  }) => {
    if (from !== undefined && to !== undefined && at === undefined) {
      return Result.combine([from, to].map(periodRaw => parsePeriodString(periodRaw).andThen(validatePeriod)))
        .map(([from, to]) => ({
          from,
          to,
        }))
    }

    if (from === undefined && to === undefined && at !== undefined) {
      return parsePeriodString(at).andThen(validatePeriod).map(at => ({ at }))
    }

    return err(new ValidationError())
  })

const validateCommand = (command: UnvalidatedListIncomeDefinitionCommand):
Result<ValidatedListIncomeDefinitionCommand, ValidationError> => {
  const {
    input: {
      sortBy, limit, offset, order, kind, from, to, at,
    }, state,
  } = command

  return buildPeriod({
    from,
    to,
    at,
  }).map(period => ({
    input: {
      sortBy,
      limit,
      offset,
      order,
      kind,
      period,
    },
    state,
  }))
}

const listIncomeDefinitions = (effects: {
  //
  findIncomeDefinitions: (_: IncomeDefinitionFindCondition) => Promise<IncomeDefinition[]>
}) => async (command: ValidatedListIncomeDefinitionCommand): Promise<IncomeDefinition[]> => {
  const entities = await effects.findIncomeDefinitions({
    userId: command.state.user.id,
    ...command.input,
  })

  return entities
}

type ListIncomeDefinitionWorkflow = (command: UnvalidatedListIncomeDefinitionCommand) => ResultAsync<IncomeDefinition[], ValidationError>

export const createIncomeDefinitionListWorkflow = (effects: {
  //
  findIncomeDefinitions: (_: IncomeDefinitionFindCondition) => Promise<IncomeDefinition[]>
}): ListIncomeDefinitionWorkflow => command =>
  ok(command)
    .andThen(validateCommand)
    .asyncMap(listIncomeDefinitions(effects))
