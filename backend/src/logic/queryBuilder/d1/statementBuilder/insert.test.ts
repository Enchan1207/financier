import { z } from 'zod'

import { buildInsertionStatement } from './insert'

describe('buildInsertionStatement', () => {
  const dummySchema = z.object({
    id: z.number(),
    name: z.string(),
  })

  test('ステートがない場合、エラーになること', () => {
    expect(() =>
      buildInsertionStatement({
        state: 'ready',
        model: dummySchema,
        tableName: 'users',
      }),
    ).toThrowError()
  })

  test('値が設定されている場合、必要なクエリとパラメータが生成されること', () => {
    const actual = buildInsertionStatement({
      state: 'prepared',
      model: dummySchema,
      tableName: 'users',
      values: {
        id: 123,
        name: 'test-name',
      },
    })

    expect(actual).toStrictEqual({
      query: 'INSERT INTO users (id,name) VALUES (?, ?)',
      params: [123, 'test-name'],
    })
  })
})
