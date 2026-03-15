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
  name: string
  status: CategoryStatus
  icon: CategoryIcon
  color: CategoryColor
}

export type IncomeCategory = CategoryBase & { type: 'income' }

export type ExpenseCategory = CategoryBase & {
  type: 'expense'
  isSaving: boolean
}

export type Category = IncomeCategory | ExpenseCategory

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
