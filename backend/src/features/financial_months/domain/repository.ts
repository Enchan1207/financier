import type dayjs from '@/logic/dayjs'

import type { FinancialMonth } from './entity'
import type { Months } from './valueObject'

export interface FinancialMonthRepository {
  insertFinancialMonth(item: FinancialMonth): Promise<FinancialMonth>

  findByFinancialYear(userId: string, financialYear: number):
  Promise<FinancialMonth[]>

  findByFinancialYearAndMonth(
    userId: string,
    financialYear: number,
    month: Months):
  Promise<FinancialMonth | undefined>

  findByDate(userId: string, date: dayjs.Dayjs):
  Promise<FinancialMonth | undefined>
}
