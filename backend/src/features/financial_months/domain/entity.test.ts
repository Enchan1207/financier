import dayjs from '@/logic/dayjs'

import type { Months } from './entity'
import { createFinancialMonth } from './entity'

describe('エンティティの生成', () => {
  describe.each([
    {
      financialYear: 2024,
      month: 12,
      expectedStartedAt: dayjs.tz('2024-12-01T00:00:00', 'Asia/Tokyo'),
      expectedEndedAt: dayjs.tz('2024-12-31T23:59:59.999', 'Asia/Tokyo'),
    },
    {
      financialYear: 2024,
      month: 4,
      expectedStartedAt: dayjs.tz('2024-04-01T00:00:00', 'Asia/Tokyo'),
      expectedEndedAt: dayjs.tz('2024-04-30T23:59:59.999', 'Asia/Tokyo'),
    },
    {
      financialYear: 2024,
      month: 1,
      expectedStartedAt: dayjs.tz('2025-01-01T00:00:00', 'Asia/Tokyo'),
      expectedEndedAt: dayjs.tz('2025-01-31T23:59:59.999', 'Asia/Tokyo'),
    },
    {
      financialYear: 2024,
      month: 3,
      expectedStartedAt: dayjs.tz('2025-03-01T00:00:00', 'Asia/Tokyo'),
      expectedEndedAt: dayjs.tz('2025-03-31T23:59:59.999', 'Asia/Tokyo'),
    },
  ])('$financialYear年度 $month月', ({
    financialYear, month, expectedStartedAt, expectedEndedAt,
  }) => {
    const entity = createFinancialMonth({
      financialYear,
      month: month as Months,
    })

    test(`${expectedStartedAt.format()} に始まること`, () => {
      expect(entity.startedAt.valueOf()).toBe(expectedStartedAt.valueOf())
    })

    test(`${expectedEndedAt.format()} に終わること`, () => {
      expect(entity.endedAt.valueOf()).toBe(expectedEndedAt.valueOf())
    })
  })
})
