import type { CategoryId } from './category'
import type { FiscalYearId } from './fiscal-year'
import type { UserId } from './user'

export type Budget = {
  userId: UserId
  /** 対象年度。userId + fiscalYearId + categoryId の複合キーで一意性を保証する */
  fiscalYearId: FiscalYearId
  /** 対象カテゴリ */
  categoryId: CategoryId
  /** 予算額（年額ベース、日本円）。強制制約ではなく超過入力を禁止しない */
  budgetAmount: number
}
