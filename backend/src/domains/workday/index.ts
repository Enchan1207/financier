import type dayjs from '@/logic/dayjs'

/** 勤務日 */
export type Workday = {
  userId: string

  financialMonthId: string
  count: number

  updatedAt: dayjs.Dayjs
}
