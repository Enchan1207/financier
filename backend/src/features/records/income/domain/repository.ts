import type { IncomeDefinition } from '@/features/definitions/income/domains/entity'
import type { FinancialMonth } from '@/features/financial_months/domains/entity'

import type { IncomeRecord } from './entity'

export interface IncomeRecordRepository {
  insertIncomeRecord(record: IncomeRecord): Promise<IncomeRecord>

  findBy(key: {
    financialMonthId: FinancialMonth['id']
    definitionId: IncomeDefinition['id']
  }): Promise<IncomeRecord | undefined>

  updateIncomeRecordValue(key: {
    financialMonthId: FinancialMonth['id']
    definitionId: IncomeDefinition['id']
  }, value: number): Promise<IncomeRecord | undefined>
}
