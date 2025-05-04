import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { ulid } from 'ulid'

import dayjs from '@/logic/dayjs'
import { ValidationError } from '@/logic/errors'

import type {
  FinancialMonth, FinancialMonthData, Months,
} from '.'

const financialTimezone = 'Asia/Tokyo'

const isValidMonth = (month: number): month is Months => month >= 1 && month <= 12

export const validateFinancialMonthData = (unvalidated: {
  financialYear: number
  month: number
}): Result<FinancialMonthData, ValidationError> => {
  if (unvalidated.financialYear < 0) {
    return err(new ValidationError())
  }

  if (!isValidMonth(unvalidated.month)) {
    return err(new ValidationError())
  }

  return ok({
    financialYear: unvalidated.financialYear,
    month: unvalidated.month,
  })
}

export const createFinancialMonth = (props: FinancialMonthData & { userId: string }): FinancialMonth => {
  const {
    month, financialYear, userId,
  } = props

  return {
    id: ulid(),
    userId: userId,
    financialYear,
    month,
  }
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
