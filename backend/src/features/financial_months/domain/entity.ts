import { ulid } from 'ulid'

import type { FinancialMonthData } from './valueObject'

/** 会計月度エンティティ */
export type FinancialMonth = FinancialMonthData & {
  id: string
  userId: string
}

export const createFinancialMonth = (props: FinancialMonthData & { userId: string }): FinancialMonth => {
  const {
    month, financialYear, userId,
  } = props

  return {
    id: ulid(),
    userId: userId,
    financialYear,
    month,
  }
}
