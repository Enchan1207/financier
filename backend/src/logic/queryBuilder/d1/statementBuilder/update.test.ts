import { z } from 'zod'

import { condition } from '../../conditionTree'
import { buildUpdateStatement } from './update'

describe('buildUpdateStatement', () => {
  const dummySchema = z.object({
    id: z.number(),
    name: z.string(),
  })

  test('変更項目がない場合、エラーになること', () => {
    expect(() =>
      buildUpdateStatement({
        state: 'modification_specified',
        model: dummySchema,
        tableName: 'users',
        modifications: {},
      }),
    ).toThrowError()
  })

  test('変更のみがある場合', () => {
    const actual = buildUpdateStatement({
      state: 'modification_specified',
      model: dummySchema,
      tableName: 'users',
      modifications: {
        id: 4,
        name: 'update',
      },
    })

    expect(actual).toStrictEqual({
      query: 'UPDATE users SET id = ?1, name = ?2',
      params: [4, 'update'],
    })
  })

  test('変更と条件がある場合', () => {
    const actual = buildUpdateStatement({
      state: 'condition_modification_specified',
      model: dummySchema,
      tableName: 'users',
      modifications: {
        id: 3,
        name: 'update',
      },
      condition: condition('id', '==', 2),
    })

    expect(actual).toStrictEqual({
      query: 'UPDATE users SET id = ?1, name = ?2 WHERE ( id == ?3 )',
      params: [3, 'update', 2],
    })
  })

  test('キーのみがあり値がundefinedの場合', () => {
    const actual = buildUpdateStatement({
      state: 'modification_specified',
      model: dummySchema,
      tableName: 'users',
      modifications: {
        id: undefined,
        name: 'update',
      },
    })

    expect(actual).toStrictEqual({
      query: 'UPDATE users SET name = ?1',
      params: ['update'],
    })
  })
})
