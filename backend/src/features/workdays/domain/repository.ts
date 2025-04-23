import type { FinancialMonth } from '@/features/financial_months/domain/entity'

import type { Workday } from './entity'

export interface WorkdayRepository {
  saveWorkday(item: Workday): Promise<Workday>
  findByFinancialMonth(month: FinancialMonth): Promise<Workday | undefined>
}
