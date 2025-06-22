import { z } from 'zod'

export const EntityIdSchema = <T extends string>(entityName: T) =>
  z.string().ulid().brand(entityName)

export type EntityId<T extends string> = z.infer<
  ReturnType<typeof EntityIdSchema<T>>
>

export const MoneySchema = z.number().int().min(0).brand('money')

export const TimestampSchema = z
  .number()
  .int()
  .min(0)
  .max(253402268399999) // 9999-12-31T23:59:59.999Z
  .brand('timestamp')
