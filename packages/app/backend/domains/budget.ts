import type { CategoryId } from './category'
import type { FiscalYearId } from './fiscal-year'

export type Budget = {
  /** 対象年度。fiscalYearId と categoryId の複合キーで一意性を保証する */
  fiscalYearId: FiscalYearId
  /** 対象カテゴリ */
  categoryId: CategoryId
  /** 予算額（年額ベース、日本円）。強制制約ではなく超過入力を禁止しない */
  budgetAmount: number
}
