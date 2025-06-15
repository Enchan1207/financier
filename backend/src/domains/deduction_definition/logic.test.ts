import { Err, Ok } from 'neverthrow'

import dayjs from '@/logic/dayjs'

import { createFinancialMonthInfo } from '../financial_month_context/logic'
import { createDeductionDefinition } from './logic'

describe('正常系', () => {
  const from = createFinancialMonthInfo({
    financialYear: 2024,
    month: 12,
  })._unsafeUnwrap()

  const to = createFinancialMonthInfo({
    financialYear: 2024,
    month: 1,
  })._unsafeUnwrap()

  const result = createDeductionDefinition({
    from,
    to,
    name: 'test',
    kind: 'absolute',
    value: 0,
    userId: 'test_user',
  })

  test('作成できること', () => {
    expect(result).toBeInstanceOf(Ok)
  })

  test('定義の開始は2024年12月はじめであること', () => {
    const expected = dayjs.tz('2024-12-01T00:00:00.000', 'Asia/Tokyo')
    const entity = result.unwrapOr(undefined)
    expect(entity?.enabledAt.valueOf()).toBe(expected.valueOf())
  })

  test('定義の終了は2025年1月おわりであること', () => {
    const expected = dayjs.tz('2025-01-31T23:59:59.999', 'Asia/Tokyo')
    const entity = result.unwrapOr(undefined)
    expect(entity?.disabledAt.valueOf()).toBe(expected.valueOf())
  })

  test('開始・終了が同月であっても問題なく作成できること', () => {
    const result = createDeductionDefinition({
      from,
      to: from,
      name: 'test',
      kind: 'absolute',
      value: 0,
      userId: 'test_user',
    })
    expect(result).toBeInstanceOf(Ok)
  })
})

describe('異常系 - 終了が開始より前', () => {
  const from = createFinancialMonthInfo({
    financialYear: 2024,
    month: 12,
  })._unsafeUnwrap()

  const to = createFinancialMonthInfo({
    financialYear: 2024,
    month: 11,
  })._unsafeUnwrap()

  const result = createDeductionDefinition({
    from,
    to,
    name: 'test',
    kind: 'absolute',
    value: 0,
    userId: 'test_user',
  })

  test('作成できないこと', () => {
    expect(result).toBeInstanceOf(Err)
  })
})
