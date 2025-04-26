import type { FinancialMonthData } from '@/features/financial_months/domain/valueObject'
import type { User } from '@/features/users/domain/entity'

import type { IncomeDefinition, IncomeDefinitionKind } from './entity'

export interface IncomeDefinitionRepository {
  insertIncomeDefinition(item: IncomeDefinition): Promise<IncomeDefinition>

  updateIncomeDefinition(id: IncomeDefinition['id'], input: Omit<IncomeDefinition, 'id'>): Promise<IncomeDefinition>

  findByUserId(props: {
    userId: User['id']
    sortBy: keyof Pick<IncomeDefinition, 'enabledAt' | 'disabledAt' | 'updatedAt'>
    filter?: IncomeDefinitionKind
    order: 'asc' | 'desc'
    limit: number
    offset?: number
  }): Promise<IncomeDefinition[]>

  findById(id: string): Promise<IncomeDefinition | undefined>

  findByFinancialMonth(props: {
    userId: User['id']
    financialMonth: FinancialMonthData
    order: 'asc' | 'desc'
    limit: number
    offset?: number
  }): Promise<IncomeDefinition[]>

  findByFinancialYear(props: {
    userId: User['id']
    financialYear: number
    order: 'asc' | 'desc'
    limit: number
    offset?: number
  }): Promise<IncomeDefinition[]>
}
