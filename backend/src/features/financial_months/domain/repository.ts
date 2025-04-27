import type dayjs from '@/logic/dayjs'

import type { FinancialMonth } from './entity'
import type { FinancialMonthData } from './valueObject'

export interface FinancialMonthRepository {
  // TODO: バルクインサートも考えたい、12件突っ込むことのほうが圧倒的に多いので
  insertFinancialMonth(item: FinancialMonth): Promise<FinancialMonth>

  findByFinancialYear(userId: string, financialYear: number):
  Promise<FinancialMonth[]>

  findByFinancialMonth(userId: string, financialMonth: FinancialMonthData):
  Promise<FinancialMonth | undefined>

  findByDate(userId: string, date: dayjs.Dayjs):
  Promise<FinancialMonth | undefined>
}
