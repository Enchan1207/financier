import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import type { z } from 'zod'

export const parseSchema = <T extends z.ZodTypeAny>(schema: T, value: unknown): Result<z.infer<typeof schema>, z.ZodError> => {
  const result = schema.safeParse(value)
  return result.success ? ok(result.data) : err(result.error)
}
