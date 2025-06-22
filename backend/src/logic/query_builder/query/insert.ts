import type { z } from 'zod'

import type { Model, QueryStateBase, QueryStateInit } from '.'

type PreparedQueryState<M extends Model> = QueryStateBase<M> & {
  state: 'prepared'
  values: z.infer<M>
}

export type InsertionQueryState<M extends Model> = PreparedQueryState<M>

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
export const createInsertionQueryBuilder = <M extends Model, P>(
  statementBuilder: (state: PreparedQueryState<M>) => P,
) => {
  const uninitialized = <M2 extends M>(
    state: QueryStateInit<M2>,
  ): InsertionQuery<M2, P> => ({
    values: (values) =>
      valueSpecified({
        ...state,
        state: 'prepared',
        values,
      }),
  })

  const valueSpecified = <M2 extends M>(state: PreparedQueryState<M2>) => ({
    build: () => statementBuilder(state),
  })

  return uninitialized
}
