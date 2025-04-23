import type dayjs from '@/logic/dayjs'

import type { FinancialMonth, Months } from './entity'

export interface FinancialMonthRepository {
  insertFinancialMonth(item: FinancialMonth): Promise<FinancialMonth>

  findByFinancialYear(financialYear: number): Promise<FinancialMonth[]>
  findByFinancialYearAndMonth(financialYear: number, month: Months):
  Promise<FinancialMonth | undefined>
  findByDate(date: dayjs.Dayjs): Promise<FinancialMonth | undefined>
}
