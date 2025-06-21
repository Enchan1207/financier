import type { Model } from '../../query'
import type { InsertionQueryState } from '../../query/insert'
import type { CommandParameters } from '..'

export const buildInsertionStatement = <M extends Model>(
  state: InsertionQueryState<M>,
): {
  query: string
  params: CommandParameters<M>[]
} => {
  return {
    query: '',
    params: [],
  }
}
