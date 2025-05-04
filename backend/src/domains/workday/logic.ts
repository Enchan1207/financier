import { ulid } from 'ulid'

import type { FinancialMonth } from '@/features/financial_months/domains/entity'
import dayjs from '@/logic/dayjs'

import type { Workday } from '.'

export const createWorkday = (props: {
  userId: string
  financialMonth: FinancialMonth
  count: number
}): Workday => {
  return {
    id: ulid(),
    userId: props.userId,
    financialMonthId: props.financialMonth.id,
    count: props.count,
    updatedAt: dayjs(),
  }
}
