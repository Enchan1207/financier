import { z } from 'zod'

export const UlidSchema = z.string().ulid()

export const MoneySchema = z.number().int().min(0)
