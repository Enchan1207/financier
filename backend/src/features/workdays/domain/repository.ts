import type { Workday } from './entity'

export interface WorkdayRepository {
  saveWorkday(item: Workday): Promise<Workday>
  findByFinancialMonthId(financialMonthId: string): Promise<Workday | undefined>
}
