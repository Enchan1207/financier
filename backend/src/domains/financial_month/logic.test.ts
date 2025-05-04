import dayjs from '@/logic/dayjs'

import type { Months } from '.'
import { getFinancialMonthFromDate, getPeriodByFinancialMonth } from './logic'

describe('会計月度と日時情報の相互変換', () => {
  describe.each([
    {
      financialYear: 2024,
      month: 12,
      expectedStart: dayjs.tz('2024-12-01T00:00:00', 'Asia/Tokyo'),
      expectedEnd: dayjs.tz('2024-12-31T23:59:59.999', 'Asia/Tokyo'),
    },
    {
      financialYear: 2024,
      month: 4,
      expectedStart: dayjs.tz('2024-04-01T00:00:00', 'Asia/Tokyo'),
      expectedEnd: dayjs.tz('2024-04-30T23:59:59.999', 'Asia/Tokyo'),
    },
    {
      financialYear: 2024,
      month: 1,
      expectedStart: dayjs.tz('2025-01-01T00:00:00', 'Asia/Tokyo'),
      expectedEnd: dayjs.tz('2025-01-31T23:59:59.999', 'Asia/Tokyo'),
    },
    {
      financialYear: 2024,
      month: 3,
      expectedStart: dayjs.tz('2025-03-01T00:00:00', 'Asia/Tokyo'),
      expectedEnd: dayjs.tz('2025-03-31T23:59:59.999', 'Asia/Tokyo'),
    },
  ])('$financialYear年度 $month月', ({
    financialYear, month, expectedStart, expectedEnd,
  }) => {
    const period = getPeriodByFinancialMonth({
      financialYear,
      month: month as Months,
    })

    const financialMonth = getFinancialMonthFromDate(expectedStart)

    test(`月度に変換した場合は ${expectedStart.format()} に始まること`, () => {
      expect(period.start.startOf('month').valueOf()).toBe(expectedStart.valueOf())
    })

    test(`月度に変換した場合は ${expectedEnd.format()} に終わること`, () => {
      const actual = period.end.endOf('month').valueOf()
      expect(actual).toBe(expectedEnd.valueOf())
    })

    test(`dayjsから変換した場合は ${financialYear}年度 ${month}月になること`, () => {
      expect(financialMonth).toStrictEqual({
        financialYear,
        month,
      })
    })
  })
})

describe('月度内からの会計月度の参照', () => {
  test.each([
    {
      now: dayjs.tz('2025-01-10T00:00:00', 'Asia/Tokyo'),
      financialYear: 2024,
      month: 1,
    },
    {
      now: dayjs.tz('2025-12-31T23:59:59.999', 'Asia/Tokyo'),
      financialYear: 2025,
      month: 12,
    },
    {
      now: dayjs.tz('2024-04-01T00:00:00.000', 'Asia/Tokyo'),
      financialYear: 2024,
      month: 4,
    },
  ])('月中で取得した場合 $financialYear年度 $month月 になること', (props) => {
    const { financialYear, month } = props
    const actual = getFinancialMonthFromDate(props.now)

    expect(actual).toStrictEqual({
      financialYear,
      month,
    })
  })
})
