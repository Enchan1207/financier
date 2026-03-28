import { z } from 'zod'

export const CreateEventRequestSchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1)),
  occurredOn: z.iso.date(),
})

export const UpdateEventRequestSchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1))
    .optional(),
  occurredOn: z.iso.date().optional(),
})
