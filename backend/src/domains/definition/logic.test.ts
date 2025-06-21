import { Err, Ok } from 'neverthrow'

import { createDefinition } from './logic'

describe('正常系', () => {
  test('1ヶ月だけの定義', () => {
    const actual = createDefinition({
      userId: '',
      name: 'test',
      value: 0,
      from: {
        financialYear: 2024,
        month: 1,
      },
      to: {
        financialYear: 2024,
        month: 1,
      },
      type: 'income',
      kind: 'absolute',
    })

    expect(actual).toBeInstanceOf(Ok)
  })

  test('通常', () => {
    const actual = createDefinition({
      userId: '',
      name: 'test',
      value: 0,
      from: {
        financialYear: 2024,
        month: 4,
      },
      to: {
        financialYear: 2024,
        month: 3,
      },
      type: 'income',
      kind: 'absolute',
    })

    expect(actual).toBeInstanceOf(Ok)
  })
})

describe('異常系', () => {
  test('不正な期間', () => {
    const actual = createDefinition({
      userId: '',
      name: 'test',
      value: 0,
      from: {
        financialYear: 2024,
        month: 2,
      },
      to: {
        financialYear: 2024,
        month: 1,
      },
      type: 'income',
      kind: 'absolute',
    })

    expect(actual).toBeInstanceOf(Err)
  })
})
