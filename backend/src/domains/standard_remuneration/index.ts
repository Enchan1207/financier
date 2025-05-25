import { z } from 'zod'

export const StandardRemunerationDataSchema = z.object({
  tableId: z.string().ulid(),
  min: z.number().int().positive(),
  value: z.number().int().positive(),
})

/** 標準報酬月額情報 */
export type StandardRemunerationData =
  z.infer<typeof StandardRemunerationDataSchema>

/** 標準報酬月額 */
export type StandardRemuneration = StandardRemunerationData & {
  id: string
  userId: string
}
