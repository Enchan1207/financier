import { z } from 'zod'

export const UlidSchema = z.string().ulid()
