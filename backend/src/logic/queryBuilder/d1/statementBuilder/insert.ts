import type { Model } from '../../query'
import type { InsertionQueryState } from '../../query/insert'
import type { CommandParameters } from '..'

export const buildInsertionStatement = <M extends Model>(
  state: InsertionQueryState<M>,
): {
  query: string
  params: CommandParameters<M>[]
} => {
  const values = state.values
  if (values === undefined) {
    throw new Error('Unexpected state: values not defined')
  }

  const keys = Object.keys(values)
  const placeholders = Array.from({ length: keys.length })
    .map(() => '?')
    .join(', ')

  const query = [
    'INSERT INTO',
    state.tableName,
    `(${keys.join(',')})`,
    'VALUES',
    `(${placeholders})`,
  ].join(' ')

  return {
    query,
    params: Object.values(values) as CommandParameters<M>[],
  }
}
