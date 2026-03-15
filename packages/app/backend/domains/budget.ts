import type { CategoryId } from './category'
import type { FiscalYearId } from './fiscal-year'

export type Budget = {
  fiscalYearId: FiscalYearId
  categoryId: CategoryId
  budgetAmount: number
}
