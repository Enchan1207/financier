import type { Model } from '../../query'
import type { DeletionQueryState } from '../../query/delete'
import type { CommandParameters } from '..'
import { buildExpression, buildParams } from './condition'

export const buildDeletionStatement = <M extends Model>(
  state: DeletionQueryState<M>,
): {
  query: string
  params: CommandParameters<M>[]
} => {
  // 条件が指定されなかった場合
  if (state.state === 'ready') {
    return {
      query: `DELETE FROM ${state.tableName}`,
      params: [],
    }
  }

  const expression = buildExpression(state.condition, 1)
  const params = buildParams(state.condition)

  const query = [
    'DELETE FROM',
    state.tableName,
    'WHERE',
    expression.query,
  ].join(' ')

  return {
    query,
    params,
  }
}
