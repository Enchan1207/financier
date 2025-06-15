import type { ResultAsync } from 'neverthrow'
import { err, ok, Result } from 'neverthrow'
import { z } from 'zod'

import {
  createFinancialMonthInfo,
  getPeriodByFinancialMonth,
} from '@/domains/financial_month_context/logic'
import type { IncomeDefinition } from '@/domains/income_definition'
import { IncomeDefinitionKind } from '@/domains/income_definition'
import type { User } from '@/domains/user'
import type dayjs from '@/logic/dayjs'
import { ValidationError } from '@/logic/errors'

const IncomeDefinitionSortKey = [
  'enabledAt',
  'disabledAt',
  'updatedAt',
] as const
type IncomeDefinitionSortKey = (typeof IncomeDefinitionSortKey)[number]

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
    period?: {
      start: dayjs.Dayjs
      end: dayjs.Dayjs
    }
  }
  state: { user: User }
}

type WorkflowEffects = {
  findIncomeDefinitions: (props: {
    userId: User['id']
    sortBy: IncomeDefinitionSortKey
    kind?: IncomeDefinitionKind
    order: 'asc' | 'desc'
    limit: number
    offset?: number
    period?: {
      start: dayjs.Dayjs
      end: dayjs.Dayjs
    }
  }) => Promise<IncomeDefinition[]>
}

const parsePeriodString = (
  periodRaw: string,
): Result<
  {
    financialYear: number
    month: number | undefined
  },
  ValidationError
> => {
  const pattern = /(?<yearRaw>\d{4})(_(?<monthRaw>\d{2}))?/
  const groups = periodRaw.match(pattern)?.groups
  if (groups === undefined) {
    return err(new ValidationError(`不正な期間文字列: ${periodRaw}`))
  }

  const { yearRaw, monthRaw } = groups
  return ok({
    financialYear: Number(yearRaw),
    month: monthRaw ? Number(monthRaw) : undefined,
  })
}

const buildPeriod = (props: {
  from: string | undefined
  to: string | undefined
  at: string | undefined
}): Result<
  {
    start: dayjs.Dayjs
    end: dayjs.Dayjs
  },
  ValidationError
> =>
  ok(props)
    .andThen(({ from, to, at }) => {
      if (from !== undefined && to !== undefined && at === undefined) {
        return ok({
          from,
          to,
        })
      }

      if (from === undefined && to === undefined && at !== undefined) {
        return ok({
          from: at,
          to: at,
        })
      }

      return err(
        new ValidationError(
          `不正な期間: ${from?.valueOf()}, ${to?.valueOf()}, ${at?.valueOf()}`,
        ),
      )
    })
    .andThen(({ from, to }) =>
      Result.combine([from, to].map(parsePeriodString)).andThen(([from, to]) =>
        Result.combine(
          [
            {
              financialYear: from.financialYear,
              month: from.month ?? 4,
              workday: 0,
            },
            {
              financialYear: to.financialYear,
              month: to.month ?? 3,
              workday: 0,
            },
          ].map(createFinancialMonthInfo),
        ),
      ),
    )
    .map(([from, to]) => {
      const { start } = getPeriodByFinancialMonth(from)
      const { end } = getPeriodByFinancialMonth(to)
      return {
        start,
        end,
      }
    })

const validateCommand = (
  command: UnvalidatedListIncomeDefinitionCommand,
): Result<ValidatedListIncomeDefinitionCommand, ValidationError> => {
  const {
    input: { sortBy, limit, offset, order, kind, from, to, at },
    state,
  } = command

  return buildPeriod({
    from,
    to,
    at,
  })
    .andThen(({ start, end }) => {
      if (end.isBefore(start)) {
        return err(new ValidationError('invalid period'))
      }

      return ok({ start, end })
    })
    .map((period) => ({
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

const listIncomeDefinitions =
  (effects: Pick<WorkflowEffects, 'findIncomeDefinitions'>) =>
  async (
    command: ValidatedListIncomeDefinitionCommand,
  ): Promise<IncomeDefinition[]> => {
    const entities = await effects.findIncomeDefinitions({
      userId: command.state.user.id,
      ...command.input,
    })

    return entities
  }

type ListIncomeDefinitionWorkflow = (
  command: UnvalidatedListIncomeDefinitionCommand,
) => ResultAsync<IncomeDefinition[], ValidationError>

export const createIncomeDefinitionListWorkflow =
  (effects: WorkflowEffects): ListIncomeDefinitionWorkflow =>
  (command) =>
    ok(command)
      .andThen(validateCommand)
      .asyncMap(listIncomeDefinitions(effects))
