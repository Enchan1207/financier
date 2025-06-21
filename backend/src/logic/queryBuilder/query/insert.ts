import type { z } from 'zod'

import type { Model, QueryStateBase, QueryStateInit } from '.'

type PreparedQueryState<M extends Model> = QueryStateBase<M> & {
  state: 'prepared'
  values: z.infer<M>
}

export type InsertionQueryState<M extends Model> =
  | PreparedQueryState<M>
  | QueryStateInit<M>

export interface InsertionQuery<M extends Model, P> {
  values(values: z.infer<M>): ValueSpecifiedInsertionQuery<P>
}

interface ValueSpecifiedInsertionQuery<T> {
  build(): T
}

/**
 * ステートメントビルダを渡して挿入クエリビルダを構成する
 * @param statementBuilder ステートメントビルダ
 * @returns 構成されたクエリビルダ
 */
export const createInsertionQueryBuilder = <N extends Model, P>(
  statementBuilder: (state: PreparedQueryState<N>) => P,
) => {
  const uninitialized = <M extends N>(
    state: QueryStateInit<M>,
  ): InsertionQuery<M, P> => ({
    values: (values) =>
      valueSpecified({
        ...state,
        state: 'prepared',
        values,
      }),
  })

  const valueSpecified = <M extends N>(state: PreparedQueryState<M>) => ({
    build: () => statementBuilder(state),
  })

  return uninitialized
}
