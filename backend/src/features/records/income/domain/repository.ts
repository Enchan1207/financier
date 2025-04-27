import type { IncomeRecord } from './entity'

export interface IncomeRecordRepository {
  insertIncomeRecord(record: IncomeRecord): Promise<IncomeRecord>
  findIncomeRecordById(id: string): Promise<IncomeRecord | undefined>
}
