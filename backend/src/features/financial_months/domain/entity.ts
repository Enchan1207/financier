import { ulid } from 'ulid'

import dayjs from '@/logic/dayjs'

export type Months = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/** 会計月度 */
export type FinancialMonth = {
  id: string

  userId: string

  financialYear: number
  month: Months

  startedAt: dayjs.Dayjs
  endedAt: dayjs.Dayjs
}

export const createFinancialMonth = (props: {
  userId: string
  financialYear: number
  month: Months
}): FinancialMonth => {
  const { month, financialYear } = props
  const actualYear = month < 4 ? financialYear + 1 : financialYear

  const jstTimezone = 'Asia/Tokyo'
  const startedAt = dayjs.tz(`${actualYear}-${String(month).padStart(2, '0')}-01T00:00:00`, jstTimezone)
  const endedAt = startedAt.endOf('month')

  return {
    id: ulid(),

    userId: props.userId,

    financialYear,
    month,

    startedAt,
    endedAt,
  }
}
