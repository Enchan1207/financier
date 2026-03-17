import { z } from 'zod'

export const CreateTransactionRequestSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().int().positive(),
  categoryId: z.string(),
  transactionDate: z.iso.date(),
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1)),
  eventId: z.string().nullable().optional(),
})

export const UpdateTransactionRequestSchema = z.object({
  amount: z.number().int().positive().optional(),
  categoryId: z.string().optional(),
  transactionDate: z.iso.date().optional(),
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1))
    .optional(),
  eventId: z.string().nullable().optional(),
})
