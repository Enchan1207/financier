import { z } from 'zod'

import { condition } from '../../conditionTree'
import { buildDeletionStatement } from './delete'

describe('buildDeletionStatement', () => {
  const dummySchema = z.object({
    id: z.number(),
    name: z.string(),
  })

  test('ステートがない場合、ベースクエリのみが生成されること', () => {
    const actual = buildDeletionStatement({
      state: 'ready',
      model: dummySchema,
      tableName: 'users',
    })

    expect(actual).toStrictEqual({
      query: 'DELETE FROM users',
      params: [],
    })
  })

  test('単一条件ステートがある場合', () => {
    const actual = buildDeletionStatement({
      state: 'condition_specified',
      model: dummySchema,
      tableName: 'users',
      condition: condition('id', '==', 2),
    })

    expect(actual).toStrictEqual({
      query: 'DELETE FROM users WHERE ( id == ?1 )',
      params: [2],
    })
  })
})
