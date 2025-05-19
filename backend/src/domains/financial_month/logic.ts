import type { Result } from 'neverthrow'
import { ulid } from 'ulid'

import dayjs from '@/logic/dayjs'
import { ValidationError } from '@/logic/errors'
import { parseSchema } from '@/logic/zod'

import type { FinancialMonth, FinancialMonthData } from '.'
import { FinancialMonthDataSchema } from '.'

const financialTimezone = 'Asia/Tokyo'

export const createFinancialMonthData = (input: {
  financialYear: number
  month: number
  workday: number
}): Result<FinancialMonthData, ValidationError> =>
  parseSchema(FinancialMonthDataSchema, input).mapErr(() => new ValidationError())

export const createFinancialMonth = (props: {
  userId: string
  financialYear: number
  month: number
  workday: number
}): Result<FinancialMonth, ValidationError> => {
  const {
    month, financialYear, workday, userId,
  } = props

  return createFinancialMonthData({
    financialYear,
    month,
    workday,
  }).map(entity => ({
    ...entity,
    id: ulid(),
    userId,
  }))
}

/** 会計月度オブジェクトが開始・終了する日時を取得する */
export const getPeriodByFinancialMonth = (fm: FinancialMonthData): {
  start: dayjs.Dayjs
  end: dayjs.Dayjs
} => {
  const actualYear = fm.month < 4 ? fm.financialYear + 1 : fm.financialYear

  const startDateString = `${actualYear}-${String(fm.month).padStart(2, '0')}-01T00:00:00`
  const start = dayjs.tz(startDateString, financialTimezone)
  const end = start.endOf('month')

  return {
    start,
    end,
  }
}

/** ある日時に相当する会計月度オブジェクトを得る */
export const getFinancialMonthFromDate = (date: dayjs.Dayjs): FinancialMonthData | undefined => {
  const dateWithTimezone = date.tz(financialTimezone)

  const year = dateWithTimezone.year()
  const month = dateWithTimezone.month() + 1

  const financialYear = month < 4 ? year - 1 : year

  return parseSchema(FinancialMonthDataSchema, {
    financialYear,
    month,
  }).match(validated => validated,
    () => undefined)
}
