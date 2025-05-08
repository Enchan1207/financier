import type { Result } from 'neverthrow'
import { z } from 'zod'

import dayjs from '@/logic/dayjs'
import { ValidationError } from '@/logic/errors'
import { parseSchema } from '@/logic/zod'

import type { FinancialMonth } from '../financial_month'
import type { Workday } from '.'

export const WorkdayValueSchema = z.number().int().min(0).max(31).brand()
export type WorkdayValue = z.infer<typeof WorkdayValueSchema>

export const createWorkday = (props: {
  userId: string
  financialMonth: FinancialMonth
  count: number
}): Result<Workday, ValidationError> =>
  parseSchema(WorkdayValueSchema, props.count)
    .map(count => ({
      userId: props.userId,
      financialMonthId: props.financialMonth.id,
      count,
      updatedAt: dayjs(),
    })).mapErr(() => new ValidationError(''))
