import type { Model, QueryState } from '@/logic/queryBuilder/query'
import { createSelectionQueryBuilder } from '@/logic/queryBuilder/query'

import type { Operation } from '..'
import { buildD1Statement } from './statementBuilder'

const buildStatementBuilderD1 = (database: D1Database) => {
  const _builder = <M extends Model>(state: QueryState<M>): D1PreparedStatement => {
    const { query, params } = buildD1Statement(state)
    return database.prepare(query).bind(...params)
  }

  return _builder
}

export const d1 = (database: D1Database): Operation<D1PreparedStatement> => ({
  select(model, tableName) {
    const builder = buildStatementBuilderD1(database)
    return createSelectionQueryBuilder(builder)({
      model,
      tableName,
    })
  },
})
