export type TransactionType = 'income' | 'expense'

export type CategoryType = TransactionType

export type CategoryStatus = 'active' | 'archived'

export type FiscalYearStatus = 'active' | 'closed'

export type SavingType = 'goal' | 'free'

export interface Category {
  id: string
  name: string
  type: CategoryType
  status: CategoryStatus
  isSavingCategory: boolean
}

export interface FiscalYear {
  id: string
  year: number
  status: FiscalYearStatus
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  transactionDate: string
  eventId?: string
  name: string
  createdAt: string
}

export interface Budget {
  fiscalYear: number
  categoryId: string
  budgetAmount: number
}

export interface SavingDefinition {
  id: string
  categoryId: string
  type: SavingType
  targetAmount?: number
  deadline?: string
}

export interface SavingWithdrawal {
  id: string
  savingDefinitionId: string
  amount: number
  withdrawalDate: string
  memo?: string
  createdAt: string
}

export interface Event {
  id: string
  name: string
  startDate?: string
  endDate?: string
}

export interface TemplateTransaction {
  categoryId: string
  amount: number
  name: string
}

export interface EventTemplate {
  id: string
  name: string
  defaultTransactions: TemplateTransaction[]
}

export interface MockFinanceState {
  categories: Category[]
  fiscalYears: FiscalYear[]
  transactions: Transaction[]
  budgets: Budget[]
  savingDefinitions: SavingDefinition[]
  savingWithdrawals: SavingWithdrawal[]
  events: Event[]
  eventTemplates: EventTemplate[]
}
