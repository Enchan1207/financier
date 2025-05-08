import type dayjs from '@/logic/dayjs'

import type { WorkdayValue } from './logic'

/** 勤務日 */
export type Workday = {
  userId: string

  financialMonthId: string
  count: WorkdayValue

  updatedAt: dayjs.Dayjs
}
