import type { Model } from '../../query'
import type { UpdateQueryState } from '../../query/update'
import type { CommandParameters } from '..'
import { buildExpression, buildParams } from './condition'

export const buildUpdateStatement = <M extends Model>(
  state: UpdateQueryState<M>,
): {
  query: string
  params: CommandParameters<M>[]
} => {
  const isValid =
    state.state === 'modification_specified' ||
    state.state === 'condition_modification_specified'
  if (!isValid) {
    throw new Error('Unexpected state: modifications not defined')
  }

  // ノーエントリ
  if (Object.keys(state.modifications).length === 0) {
    throw new Error('Unexpected state: no modifications found')
  }

  const modificationClause = Object.keys(state.modifications)
    .map((key, index) => `${key} = ?${index + 1}`)
    .join(', ')

  const modificationParams = Object.values(
    state.modifications,
  ) as CommandParameters<M>[]

  if (state.state === 'modification_specified') {
    const query = ['UPDATE', state.tableName, 'SET', modificationClause].join(
      ' ',
    )

    return {
      query,
      params: modificationParams,
    }
  }

  const expression = buildExpression(
    state.condition,
    modificationParams.length + 1,
  )
  const params = buildParams(state.condition)

  const query = [
    'UPDATE',
    state.tableName,
    'SET',
    modificationClause,
    'WHERE',
    expression.query,
  ].join(' ')

  return {
    query,
    params: [...modificationParams, ...params],
  }
}
