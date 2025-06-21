import type { Buildable, Model } from '.'

export type InsertionQueryState<M extends Model> = {
  model: M
  tableName: string
  values?: M
}

export interface InsertionQuery<M extends Model> {
  values(values: M): this
}

/**
 * ステートメントビルダを渡して挿入クエリビルダを構成する
 * @param statementBuilder ステートメントビルダ
 * @returns 構成されたクエリビルダ
 */
export const createInsertionQueryBuilder = <
  M extends Model,
  S extends InsertionQueryState<M>,
  P,
>(
  statementBuilder: (state: S) => P,
): ((state: S) => Buildable<InsertionQuery<M>, P>) => {
  const _build = (state: S): Buildable<InsertionQuery<M>, P> => ({
    values(values) {
      const newState: S = {
        ...state,
        values,
      }

      return _build(newState)
    },

    build: () => statementBuilder(state),
  })

  return _build
}
