import type { FinancialMonthData } from '@/features/financial_months/domains/valueObject'
import type { User } from '@/features/users/domains/entity'

import type {
  createIncomeDefinition, IncomeDefinition, IncomeDefinitionKind,
} from './entity'

export type IncomeDefinitionSortKey = keyof Pick<IncomeDefinition, 'enabledAt' | 'disabledAt' | 'updatedAt'>

export type IncomeDefinitionFilter = {
  sortBy: IncomeDefinitionSortKey
  kind?: IncomeDefinitionKind
  order: 'asc' | 'desc'
  limit: number
  offset?: number
}

export interface IncomeDefinitionRepository {
  insertIncomeDefinition(item: IncomeDefinition): Promise<IncomeDefinition>

  updateIncomeDefinition(id: IncomeDefinition['id'], input: Partial<Omit<Parameters<typeof createIncomeDefinition>[0], 'userId'>>): Promise<IncomeDefinition | undefined>

  // NOTE: 定義を消すと実績を戻せなくなるリスクがある(というか外部キー定義でエラーになるはず)。要検討
  deleteIncomeDefinition(id: IncomeDefinition['id']): Promise<IncomeDefinition | undefined>

  findByUserId(props: { userId: User['id'] } & IncomeDefinitionFilter): Promise<IncomeDefinition[]>

  findById(id: string): Promise<IncomeDefinition | undefined>

  findByFinancialMonth(props: {
    userId: User['id']
    financialMonth: FinancialMonthData
  } & IncomeDefinitionFilter): Promise<IncomeDefinition[]>

  findByFinancialYear(props: {
    userId: User['id']
    financialYear: number
  } & IncomeDefinitionFilter): Promise<IncomeDefinition[]>
}
