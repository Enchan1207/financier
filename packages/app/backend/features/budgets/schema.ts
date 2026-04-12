import { z } from 'zod'

const BudgetItemSchema = z.object({
  categoryId: z.string().min(1),
  budgetAmount: z.number().int().nonnegative(),
})

export const CreateBudgetsRequestSchema = z.object({
  year: z.number().int().positive(),
  items: z.array(BudgetItemSchema),
})

export const UpdateBudgetsRequestSchema = z.object({
  items: z.array(BudgetItemSchema),
})

export const UpdateBudgetItemRequestSchema = z.object({
  budgetAmount: z.number().int().nonnegative(),
})
