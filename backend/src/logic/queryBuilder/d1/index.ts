import type { SelectionQueryState } from '@/logic/queryBuilder/query/select'
import { createSelectionQueryBuilder } from '@/logic/queryBuilder/query/select'

import type { Operation } from '..'
import type { ConditionLeaf } from '../conditionTree'
import type { Model } from '../query'
import type { InsertionQueryState } from '../query/insert'
import { createInsertionQueryBuilder } from '../query/insert'
import { buildInsertionStatement } from './statementBuilder/insert'
import { buildSelectionStatement } from './statementBuilder/select'

export type CommandParameters<M extends Model> =
  | ConditionLeaf<M, keyof M['shape']>['value'][]
  | number
  | string

export const d1 = (database: D1Database): Operation<D1PreparedStatement> => ({
  select(model, tableName) {
    const builder = <M extends Model>(
      state: SelectionQueryState<M>,
    ): D1PreparedStatement => {
      const { query, params } = buildSelectionStatement(state)
      return database.prepare(query).bind(...params)
    }

    return createSelectionQueryBuilder(builder)({
      model,
      tableName,
    })
  },

  insert(model, tableName) {
    const builder = <M extends Model>(
      state: InsertionQueryState<M>,
    ): D1PreparedStatement => {
      const { query, params } = buildInsertionStatement(state)
      return database.prepare(query).bind(...params)
    }

    return createInsertionQueryBuilder(builder)({
      model,
      tableName,
    })
  },
})
