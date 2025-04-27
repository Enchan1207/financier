import type { createIncomeRecord, IncomeRecord } from './entity'

export interface IncomeRecordRepository {
  insertIncomeRecord(record: IncomeRecord): Promise<IncomeRecord>
  findById(id: IncomeRecord['id']): Promise<IncomeRecord | undefined>
  updateIncomeDefinition(id: IncomeRecord['id'], input: Partial<Omit<Parameters<typeof createIncomeRecord>[0], 'userId'>>): Promise<IncomeRecord | undefined>
}
