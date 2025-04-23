import { ulid } from 'ulid'

import type { FinancialMonth } from '@/features/financial_months/domain/entity'
import dayjs from '@/logic/dayjs'

/** 勤務日 */
export type Workday = {
  id: string

  userId: string

  financialMonthId: string
  count: number

  updatedAt: dayjs.Dayjs
}

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
