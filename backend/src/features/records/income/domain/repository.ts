import type { IncomeRecord } from './entity'

export interface IncomeRecordRepository {
  insertIncomeRecord(record: IncomeRecord): Promise<IncomeRecord>
  findById(id: IncomeRecord['id']): Promise<IncomeRecord | undefined>
  updateIncomeDefinitionValue(id: IncomeRecord['id'], value: number): Promise<IncomeRecord | undefined>
}
