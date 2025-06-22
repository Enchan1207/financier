import { err, ok, Result } from 'neverthrow'
import { ulid } from 'ulid'

import dayjs from '@/logic/dayjs'
import { ValidationError } from '@/logic/errors'
import { parseSchema } from '@/logic/zod'

import {
  createFinancialMonthInfo,
  getPeriodByFinancialMonth,
} from '../monthly_context/logic'
import type { User } from '../user'
import type {
  DeductionDefinitionKind,
  Definition,
  IncomeDefinitionKind,
} from '.'
import { DefinitionSchema } from '.'

export const createDefinition = (
  props: {
    userId: User['id']
    name: string
    value: number
    from: {
      financialYear: number
      month: number
    }
    to: {
      financialYear: number
      month: number
    }
  } & (
    | {
        type: 'income'
        kind: IncomeDefinitionKind
      }
    | {
        type: 'deduction'
        kind: DeductionDefinitionKind
      }
  ),
): Result<Definition, ValidationError> =>
  Result.combine([props.from, props.to].map(createFinancialMonthInfo))
    .andThen(([from, to]) => {
      const { start: fromStart } = getPeriodByFinancialMonth(from)
      const { start: toStart, end } = getPeriodByFinancialMonth(to)

      if (toStart.isBefore(fromStart)) {
        const startTime = fromStart.valueOf()
        const endTime = toStart.valueOf()
        return err(
          new ValidationError(
            `from must be earlier than to (${startTime} -> ${endTime})`,
          ),
        )
      }

      return ok({ start: fromStart, end })
    })
    .andThen(({ start, end }) => {
      const base = {
        id: ulid(),
        userId: props.userId,
        name: props.name,
        value: props.value,
        enabledAt: start.valueOf(),
        disabledAt: end.valueOf(),
        updatedAt: dayjs().valueOf(),
      }

      if (props.type === 'income') {
        return parseSchema(DefinitionSchema, {
          ...base,
          type: 'income',
          kind: props.kind,
        })
      }

      return parseSchema(DefinitionSchema, {
        ...base,
        type: 'deduction',
        kind: props.kind,
      })
    })
