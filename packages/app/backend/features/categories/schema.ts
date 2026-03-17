import { CategoryColors, CategoryIcons } from '@backend/domains/category'
import z from 'zod'

export const CategoryIconSchema = z.enum(CategoryIcons)
export const CategoryColorSchema = z.enum(CategoryColors)

export const CreateCategoryRequestSchema = z.object({
  type: z.enum(['income', 'expense', 'saving']),
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1)),
  icon: CategoryIconSchema,
  color: CategoryColorSchema,
})

export const UpdateCategoryRequestSchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1)),
  icon: CategoryIconSchema,
  color: CategoryColorSchema,
})
