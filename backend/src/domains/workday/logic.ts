import { ulid } from 'ulid'

import dayjs from '@/logic/dayjs'

import type { FinancialMonth } from '../financial_month'
import type { Workday } from '.'

// TODO: countの値域チェックを挟んでも良いのでは?
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
