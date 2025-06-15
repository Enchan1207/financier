import { Ok } from 'neverthrow'

import dayjs from '@/logic/dayjs'

import { getDefaultStandardIncomeGrades } from './defaults'

describe('デフォルト値の取得', () => {
  test('取得できること', () => {
    const actual = getDefaultStandardIncomeGrades(dayjs())
    expect(actual).toBeInstanceOf(Ok)
  })
})
