import type { z } from 'zod'

export type Model = z.AnyZodObject

export type Columns<M extends Model> = keyof M['shape']

export type Buildable<T, U> = T & { build(): U }

export type QueryStateBase<M extends Model> = {
  model: M
  tableName: string
}

export type QueryStateInit<M extends Model> = QueryStateBase<M> & {
  state: 'ready'
}

export interface PreparedQuery<P> {
  build(): P
}
