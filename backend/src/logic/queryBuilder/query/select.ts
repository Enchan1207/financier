import type { ConditionNode } from '../conditionTree'
import type { Buildable, Columns, Model } from '.'

type Order = 'asc' | 'desc'

export type SelectionQueryState<M extends Model> = {
  model: M
  tableName: string
  range?: {
    limit: number
    offset?: number
  }
  orders?: {
    key: Columns<M>
    order?: Order
  }[]
  condition?: ConditionNode<M>
}

export interface SelectionQuery<M extends Model> {
  limit(limit: number, offset?: number): this
  orderBy(key: Columns<M>, order?: Order): this
  where(condition: ConditionNode<M>): this
}

/**
 * ビルダーを渡して選択クエリビルダを構成する
 * @param statementBuilder ステートメントビルダ
 * @returns 構成されたクエリビルダ
 */
export const createSelectionQueryBuilder = <
  M extends Model,
  S extends SelectionQueryState<M>,
  P,
>(
  statementBuilder: (state: S) => P,
): ((state: S) => Buildable<SelectionQuery<M>, P>) => {
  const _build = (state: S): Buildable<SelectionQuery<M>, P> => ({
    limit(limit, offset) {
      const newState: S = {
        ...state,
        range: {
          limit,
          offset,
        },
      }
      return _build(newState)
    },

    orderBy(key, order) {
      const newState: S = {
        ...state,
        orders: [
          ...(state.orders ?? []),
          {
            key,
            order: order ?? 'asc',
          },
        ],
      }
      return _build(newState)
    },

    where(condition) {
      const newState: S = {
        ...state,
        condition,
      }
      return _build(newState)
    },

    build: () => statementBuilder(state),
  })

  return _build
}
