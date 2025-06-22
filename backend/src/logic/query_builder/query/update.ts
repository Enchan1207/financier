import type { z } from 'zod'

import type { ConditionNode } from '../condition_tree'
import type { Model, PreparedQuery, QueryStateBase, QueryStateInit } from '.'

type ConditionSpecifiedQueryState<M extends Model> = QueryStateBase<M> & {
  state: 'condition_specified'
  condition: ConditionNode<M>
}

type ModificationSpecifiedQueryState<M extends Model> = QueryStateBase<M> & {
  state: 'modification_specified'
  modifications: Partial<z.infer<M>>
}

type ConditionAndModificationSpecifiedQueryState<M extends Model> =
  QueryStateBase<M> & {
    state: 'condition_modification_specified'
    modifications: Partial<z.infer<M>>
    condition: ConditionNode<M>
  }

export type UpdateQueryState<M extends Model> =
  | ModificationSpecifiedQueryState<M>
  | ConditionAndModificationSpecifiedQueryState<M>

// エントリポイント
export interface UpdateQuery<M extends Model, P> {
  where(condition: ConditionNode<M>): ConditionSpecifiedUpdateQuery<M, P>
  set(values: Partial<z.infer<M>>): ModificationSpecifiedQuery<M, P>
}

// 条件のみ指定
interface ConditionSpecifiedUpdateQuery<M extends Model, P> {
  set(values: Partial<z.infer<M>>): PreparedQuery<P>
}

// 変更のみ指定
interface ModificationSpecifiedQuery<M extends Model, P> {
  where(condition: ConditionNode<M>): PreparedQuery<P>
  build(): P
}

export const createUpdateQueryBuilder = <M extends Model, P>(
  statementBuilder: (state: UpdateQueryState<M>) => P,
) => {
  const uninitialized = <M2 extends M>(
    state: QueryStateInit<M2>,
  ): UpdateQuery<M2, P> => ({
    where: (condition) =>
      conditionSpecified({
        ...state,
        state: 'condition_specified',
        condition,
      }),

    set: (modifications) =>
      modificationSpecified({
        ...state,
        state: 'modification_specified',
        modifications,
      }),
  })

  const conditionSpecified = <M2 extends M>(
    state: ConditionSpecifiedQueryState<M2>,
  ): ConditionSpecifiedUpdateQuery<M2, P> => ({
    set: (modifications) =>
      modificationAndConditionSpecified({
        ...state,
        state: 'condition_modification_specified',
        modifications,
      }),
  })

  const modificationSpecified = <M2 extends M>(
    state: ModificationSpecifiedQueryState<M2>,
  ): ModificationSpecifiedQuery<M2, P> => ({
    where: (condition) =>
      modificationAndConditionSpecified({
        ...state,
        state: 'condition_modification_specified',
        condition,
      }),
    build: () => statementBuilder(state),
  })

  const modificationAndConditionSpecified = <M2 extends M>(
    state: ConditionAndModificationSpecifiedQueryState<M2>,
  ): PreparedQuery<P> => ({
    build: () => statementBuilder(state),
  })

  return uninitialized
}
