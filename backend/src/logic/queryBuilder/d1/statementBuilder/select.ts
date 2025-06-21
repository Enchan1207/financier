import { ok } from 'neverthrow'

import type { SelectionQueryState } from '@/logic/queryBuilder/query/select'

import type { Model } from '../../query'
import type { CommandParameters } from '..'
import { buildExpression, buildParams } from './condition'

type Command<M extends Model> = {
  input: SelectionQueryState<M>
  state: {
    query: string
    index: number
    params: CommandParameters<M>[]
  }
}

/** クエリの状態からD1用のSQLを生成する */
export const buildSelectionStatement = <M extends Model>(
  state: SelectionQueryState<M>,
): {
  query: string
  params: CommandParameters<M>[]
} => {
  const command: Command<M> = {
    input: state,
    state: {
      query: '',
      index: 1,
      params: [],
    },
  }

  // ここでResultを持ち出すのは意味がないので、できればメソッドチェーン用の型を作りたかった
  // しかし難しすぎて断念
  const {
    state: { query, params },
  } = ok(command)
    .map(buildBaseStatement)
    .map(buildConditionStatement)
    .map(buildOrderStatement)
    .map(buildRangeStatement)
    .unwrapOr(command)

  return {
    query,
    params,
  }
}

/** SQLのベースになるステートメントを生成する */
const buildBaseStatement = <M extends Model>({
  input,
  state,
}: Command<M>): Command<M> => {
  const modelShape = input.model.shape as Record<string, unknown>
  const columns: (keyof M['shape'])[] = Object.keys(modelShape)
  const query = ['SELECT', columns.join(','), 'FROM', input.tableName].join(' ')

  return {
    input,
    state: {
      query,
      index: state.index,
      params: state.params,
    },
  }
}

/** 条件ステートメントを生成する */
const buildConditionStatement = <M extends Model>({
  input,
  state,
}: Command<M>): Command<M> => {
  const condition = input.condition
  if (condition === undefined) {
    return {
      input,
      state,
    }
  }

  const expression = buildExpression(condition, state.index)
  const params = buildParams(condition)

  return {
    input,
    state: {
      query: state.query + ' WHERE ' + expression.query,
      index: expression.index,
      params: [...state.params, ...params],
    },
  }
}

/** 順序ステートメントを生成する */
const buildOrderStatement = <M extends Model>({
  input,
  state,
}: Command<M>): Command<M> => {
  const orders = input.orders
  if (orders === undefined) {
    return {
      input,
      state,
    }
  }

  const statement = orders
    .map(
      ({ key, order }) => `${key.toString()} ${(order ?? 'asc').toUpperCase()}`,
    )
    .join(', ')

  return {
    input,
    state: {
      query: state.query + ` ORDER BY ${statement}`,
      index: state.index,
      params: state.params,
    },
  }
}

/** 範囲ステートメントを生成する */
const buildRangeStatement = <M extends Model>({
  input,
  state,
}: Command<M>): Command<M> => {
  const range = input.range
  if (range === undefined) {
    return {
      input,
      state,
    }
  }

  const { limit, offset } = range
  if (offset === undefined) {
    return {
      input,
      state: {
        query: state.query + ` LIMIT ?${state.index}`,
        index: state.index + 1,
        params: [...state.params, limit],
      },
    }
  }

  return {
    input,
    state: {
      query: state.query + ` LIMIT ?${state.index} OFFSET ?${state.index + 1}`,
      index: state.index + 2,
      params: [...state.params, limit, offset],
    },
  }
}
