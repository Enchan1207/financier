import { z } from 'zod'

const templateTransactionSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  amount: z.number().int().positive(),
})

export const CreateEventTemplateRequestSchema = z.object({
  name: z.string().min(1),
  defaultTransactions: z.array(templateTransactionSchema).min(1),
})

export const UpdateEventTemplateRequestSchema = z.object({
  name: z.string().min(1).optional(),
  defaultTransactions: z.array(templateTransactionSchema).min(1).optional(),
})

export const RegisterEventTemplateRequestSchema = z.object({
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z
    .array(
      z.object({
        categoryId: z.string().min(1),
        name: z.string().min(1),
        amount: z.number().int().positive(),
      }),
    )
    .min(1),
})
