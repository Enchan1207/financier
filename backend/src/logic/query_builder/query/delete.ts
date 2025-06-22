import type { ConditionNode } from '../condition_tree'
import type { Model, QueryStateBase, QueryStateInit } from '.'

type ConditionSpecifiedQueryState<M extends Model> = QueryStateBase<M> & {
  state: 'condition_specified'
  condition: ConditionNode<M>
}

export type DeletionQueryState<M extends Model> =
  | ConditionSpecifiedQueryState<M>
  | QueryStateInit<M>

export interface DeletionQuery<M extends Model, P> {
  where(condition: ConditionNode<M>): ConditionSpecifiedDeletionQuery<P>
  build(): P
}

interface ConditionSpecifiedDeletionQuery<P> {
  build(): P
}

export const createDeletionQueryBuilder = <M extends Model, P>(
  statementBuilder: (state: DeletionQueryState<M>) => P,
) => {
  const uninitialized = <M2 extends M>(
    state: QueryStateInit<M2>,
  ): DeletionQuery<M2, P> => ({
    where: (condition) =>
      conditionSpecified({
        ...state,
        state: 'condition_specified',
        condition,
      }),
    build: () => statementBuilder(state),
  })

  const conditionSpecified = <M2 extends M>(
    state: ConditionSpecifiedQueryState<M2>,
  ): ConditionSpecifiedDeletionQuery<P> => ({
    build: () => statementBuilder(state),
  })

  return uninitialized
}
