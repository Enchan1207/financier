/**
 * このモジュールはバックエンド実装までのモックであり、将来的に削除される予定です。
 */

import type {
  CategoryColor,
  CategoryIcon,
} from '@frontend/components/category/types'

export type TransactionType = 'income' | 'expense'

export type Category = {
  id: string
  name: string
  type: TransactionType
  isSaving: boolean
  icon: CategoryIcon
  color: CategoryColor
}

export type Transaction = {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  categoryName: string
  transactionDate: string
  eventId?: string
  eventName?: string
  name: string
}

// 予算は年度単位。表示時は /12 で月次目安を算出する
export type AnnualBudget = {
  categoryId: string
  categoryName: string
  annualBudget: number
  // 当月実績（本来はAPIから取得。モックでは手動設定）
  currentMonthActual: number
}

export type SavingDefinition = {
  id: string
  categoryId: string
  categoryName: string
  type: 'goal' | 'free'
  targetAmount?: number
  deadline?: string
  balance: number
  monthlyGuide?: number
}

export type SavingWithdrawal = {
  id: string
  savingDefinitionId: string
  amount: number
  withdrawalDate: string
  memo?: string
  createdAt: string
}

export type Event = {
  id: string
  name: string
  dateRange?: { start: string; end?: string }
  totalAmount: number
}
