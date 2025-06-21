import type { SelectionQueryState } from '@/logic/queryBuilder/query/select'
import { createSelectionQueryBuilder } from '@/logic/queryBuilder/query/select'

import type { Operation } from '..'
import type { ConditionLeaf } from '../conditionTree'
import type { Model } from '../query'
import type { DeletionQueryState } from '../query/delete'
import { createDeletionQueryBuilder } from '../query/delete'
import type { InsertionQueryState } from '../query/insert'
import { createInsertionQueryBuilder } from '../query/insert'
import type { UpdateQueryState } from '../query/update'
import { createUpdateQueryBuilder } from '../query/update'
import { buildDeletionStatement } from './statementBuilder/delete'
import { buildInsertionStatement } from './statementBuilder/insert'
import { buildSelectionStatement } from './statementBuilder/select'
import { buildUpdateStatement } from './statementBuilder/update'

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
      state: 'ready',
      model,
      tableName,
    })
  },

  delete(model, tableName) {
    const builder = <M extends Model>(
      state: DeletionQueryState<M>,
    ): D1PreparedStatement => {
      const { query, params } = buildDeletionStatement(state)
      return database.prepare(query).bind(...params)
    }

    return createDeletionQueryBuilder(builder)({
      state: 'ready',
      model,
      tableName,
    })
  },

  update(model, tableName) {
    const builder = <M extends Model>(
      state: UpdateQueryState<M>,
    ): D1PreparedStatement => {
      const { query, params } = buildUpdateStatement(state)
      return database.prepare(query).bind(...params)
    }

    return createUpdateQueryBuilder(builder)({
      state: 'ready',
      model,
      tableName,
    })
  },
})
