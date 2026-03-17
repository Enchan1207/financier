import type { Brand } from '@backend/lib/brand'
import { ulid } from 'ulid'

export type CategoryId = Brand<string, 'category_id'>
export type CategoryStatus = 'active' | 'archived'
export const CategoryIcons = [
  'tag',
  'wallet',
  'trending_up',
  'trending_down',
  'piggy_bank',
  'house',
  'utensils',
  'shopping_cart',
  'car',
  'bus',
  'plane',
  'heart_pulse',
  'graduation_cap',
  'briefcase',
  'music',
  'zap',
  'wifi',
  'shirt',
  'dumbbell',
  'coffee',
  'gift',
  'book',
  'baby',
  'plus',
] as const
export type CategoryIcon = (typeof CategoryIcons)[number]

export const CategoryColors = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'purple',
  'pink',
] as const
export type CategoryColor = (typeof CategoryColors)[number]

type CategoryBase = {
  id: CategoryId
  /** カテゴリ名。空文字・空白のみ不可（前後空白除去後） */
  name: string
  /** 利用状態。archived のカテゴリは新規トランザクション作成時の選択肢に表示しない */
  status: CategoryStatus
  /** 表示アイコン識別子。Lucide コンポーネント名の snake_case 表記 */
  icon: CategoryIcon
  /** 表示色識別子。TailwindCSS カラー名（-500 相当）に対応 */
  color: CategoryColor
}

export type IncomeCategory = CategoryBase & { type: 'income' }

export type ExpenseCategory = CategoryBase & { type: 'expense' }

export type SavingCategory = CategoryBase & { type: 'saving' }

export type Category = IncomeCategory | ExpenseCategory | SavingCategory

export type ActiveCategory = Category & { status: 'active' }
export type ArchivedCategory = Category & { status: 'archived' }

export const isActiveCategory = (c: Category): c is ActiveCategory =>
  c.status === 'active'

export const isArchivedCategory = (c: Category): c is ArchivedCategory =>
  c.status === 'archived'

export const createIncomeCategory = (
  props: Omit<IncomeCategory, 'id' | 'status'>,
): IncomeCategory => ({
  id: ulid() as CategoryId,
  status: 'active',
  ...props,
})

export const createExpenseCategory = (
  props: Omit<ExpenseCategory, 'id' | 'status'>,
): ExpenseCategory => ({
  id: ulid() as CategoryId,
  status: 'active',
  ...props,
})

export const createSavingCategory = (
  props: Omit<SavingCategory, 'id' | 'status'>,
): SavingCategory => ({
  id: ulid() as CategoryId,
  status: 'active',
  ...props,
})
