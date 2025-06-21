import type { z } from 'zod'

export type Model = z.AnyZodObject

export type Columns<M extends Model> = keyof M['shape']

export type Buildable<T, U> = T & { build(): U }
