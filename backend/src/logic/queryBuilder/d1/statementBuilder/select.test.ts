import { z } from 'zod'

import { condition, every, some } from '../../conditionTree'
import { buildSelectionStatement } from './select'

describe('buildSelectionStatement', () => {
  const dummySchema = z.object({
    id: z.number(),
    name: z.string(),
  })

  test('ステートがない場合、ベースクエリのみが生成されること', () => {
    const actual = buildSelectionStatement({
      model: dummySchema,
      tableName: 'users',
    })

    expect(actual).toStrictEqual({
      query: 'SELECT id,name FROM users',
      params: [],
    })
  })

  test('範囲ステートのうちlimitがある場合、必要なクエリとパラメータが生成されること', () => {
    const actual = buildSelectionStatement({
      model: dummySchema,
      tableName: 'users',
      range: { limit: 10 },
    })

    expect(actual).toStrictEqual({
      query: 'SELECT id,name FROM users LIMIT ?1',
      params: [10],
    })
  })

  test('範囲ステートのうちlimit, offsetがある場合、必要なクエリとパラメータが生成されること', () => {
    const actual = buildSelectionStatement({
      model: dummySchema,
      tableName: 'users',
      range: {
        limit: 10,
        offset: 2,
      },
    })

    expect(actual).toStrictEqual({
      query: 'SELECT id,name FROM users LIMIT ?1 OFFSET ?2',
      params: [10, 2],
    })
  })

  test('順序ステートがある場合、必要なクエリとパラメータが生成されること', () => {
    const actual = buildSelectionStatement({
      model: dummySchema,
      tableName: 'users',
      orders: [
        {
          key: 'id',
          order: 'desc',
        },
      ],
    })

    expect(actual).toStrictEqual({
      query: 'SELECT id,name FROM users ORDER BY id DESC',
      params: [],
    })
  })

  test('複数の順序ステート', () => {
    const actual = buildSelectionStatement({
      model: dummySchema,
      tableName: 'users',
      orders: [
        {
          key: 'id',
          order: 'desc',
        },
        {
          key: 'name',
          order: 'asc',
        },
      ],
    })

    expect(actual).toStrictEqual({
      query: 'SELECT id,name FROM users ORDER BY id DESC, name ASC',
      params: [],
    })
  })

  test('順序ステートで方向を指定しなかった場合、ASCになること', () => {
    const actual = buildSelectionStatement({
      model: dummySchema,
      tableName: 'users',
      orders: [{ key: 'name' }],
    })

    expect(actual).toStrictEqual({
      query: 'SELECT id,name FROM users ORDER BY name ASC',
      params: [],
    })
  })

  test('単一条件ステートがある場合', () => {
    const actual = buildSelectionStatement({
      model: dummySchema,
      tableName: 'users',
      condition: condition('id', '==', 2),
    })

    expect(actual).toStrictEqual({
      query: 'SELECT id,name FROM users WHERE ( id == ?1 )',
      params: [2],
    })
  })

  test('複合条件ステートがある場合', () => {
    const actual = buildSelectionStatement({
      model: dummySchema,
      tableName: 'users',
      condition: some(
        condition('id', '==', 2),
        every(condition('id', '>', 3), condition('name', '!=', 'admin')),
      ),
    })

    expect(actual).toStrictEqual({
      query:
        'SELECT id,name FROM users WHERE ( ( id == ?1 ) OR ( ( id > ?2 ) AND ( name != ?3 ) ) )',
      params: [2, 3, 'admin'],
    })
  })

  test('全部盛り', () => {
    const actual = buildSelectionStatement({
      model: dummySchema,
      tableName: 'users',
      range: {
        limit: 10,
        offset: 2,
      },
      orders: [
        {
          key: 'name',
          order: 'desc',
        },
      ],
      condition: some(
        condition('id', '==', 2),
        every(condition('id', '>', 3), condition('name', '!=', 'admin')),
      ),
    })

    expect(actual).toStrictEqual({
      query:
        'SELECT id,name FROM users WHERE ( ( id == ?1 ) OR ( ( id > ?2 ) AND ( name != ?3 ) ) ) ORDER BY name DESC LIMIT ?4 OFFSET ?5',
      params: [2, 3, 'admin', 10, 2],
    })
  })
})
