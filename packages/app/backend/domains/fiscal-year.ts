import type { Brand } from '@backend/lib/brand'
import { ulid } from 'ulid'

export type FiscalYearId = Brand<string, 'fiscal_year_id'>
export type FiscalYearStatus = 'active' | 'closed'

export type FiscalYear = {
  id: FiscalYearId
  year: number
  status: FiscalYearStatus
}

export const createFiscalYear = (year: number): FiscalYear => ({
  id: ulid() as FiscalYearId,
  year,
  status: 'active',
})
