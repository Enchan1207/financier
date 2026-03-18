import type { Brand } from '@backend/lib/brand'
import { ulid } from 'ulid'

import type { UserId } from './user'

export type FiscalYearId = Brand<string, 'fiscal_year_id'>
export type FiscalYearStatus = 'active' | 'closed'

export type FiscalYear = {
  id: FiscalYearId
  userId: UserId
  /** 年度の開始年（例: 2026年度 → 2026）。期間は4月1日〜翌年3月31日 */
  year: number
  /** 年度の状態。closed は年度締め済みを表す */
  status: FiscalYearStatus
}

export const createFiscalYear = (userId: UserId, year: number): FiscalYear => ({
  id: ulid() as FiscalYearId,
  userId,
  year,
  status: 'active',
})
