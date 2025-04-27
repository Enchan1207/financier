import dayjs from '@/logic/dayjs'

export const Months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
export type Months = typeof Months[number]

/** 会計月度 */
export type FinancialMonthData = {
  financialYear: number
  month: Months
}

const financialTimezone = 'Asia/Tokyo'

/** 会計月度オブジェクトが開始・終了する日時を取得する */
export const getPeriodByFinancialMonth = (fm: FinancialMonthData): {
  start: dayjs.Dayjs
  end: dayjs.Dayjs
} => {
  const actualYear = fm.month < 4 ? fm.financialYear + 1 : fm.financialYear

  const start = dayjs.tz(`${actualYear}-${String(fm.month).padStart(2, '0')}-01T00:00:00`, financialTimezone)
  const end = start.endOf('month')

  return {
    start,
    end,
  }
}

/** ある日時に相当する会計月度オブジェクトを得る */
export const getFinancialMonthFromDate = (date: dayjs.Dayjs): FinancialMonthData => {
  const dateWithTimezone = date.tz(financialTimezone)

  const year = dateWithTimezone.year()
  const month = dateWithTimezone.month() + 1

  const actualYear = month < 4 ? year - 1 : year

  return {
    financialYear: actualYear,
    month: month as Months,
  }
}
