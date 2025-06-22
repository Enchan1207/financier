import type { Result } from 'neverthrow'
import { ulid } from 'ulid'

import dayjs from '@/logic/dayjs'
import { ValidationError } from '@/logic/errors'
import { parseSchema } from '@/logic/zod'

import type { Actual } from '../actual'
import type { Definition } from '../definition'
import type { FinancialMonthInfo, MonthlyContext } from '.'
import { FinancialMonthInfoSchema, MonthlyContextSchema } from '.'

const financialTimezone = 'Asia/Tokyo'

export const createFinancialMonthInfo = (props: {
  financialYear: number
  month: number
}): Result<FinancialMonthInfo, ValidationError> =>
  parseSchema(FinancialMonthInfoSchema, props).mapErr(
    (error) => new ValidationError(error.message),
  )

export const createMonthlyContext = (props: {
  userId: string
  financialYear: number
  month: number
  workday: number
  definitions: Definition[]
  actuals: Actual[]
}): Result<MonthlyContext, ValidationError> =>
  parseSchema(MonthlyContextSchema, {
    ...props,
    id: ulid(),
  }).mapErr((error) => new ValidationError(error.message))

/** 会計月度コンテキストが開始・終了する日時を取得する */
export const getPeriodByFinancialMonth = (
  info: FinancialMonthInfo,
): {
  start: dayjs.Dayjs
  end: dayjs.Dayjs
} => {
  const actualYear =
    info.month < 4 ? info.financialYear + 1 : info.financialYear

  const startDateString = `${actualYear}-${String(info.month).padStart(2, '0')}-01T00:00:00`
  const start = dayjs.tz(startDateString, financialTimezone)
  const end = start.endOf('month')

  return {
    start,
    end,
  }
}

/** ある日時に相当する会計月度情報を得る */
export const getFinancialMonthFromDate = (
  date: dayjs.Dayjs,
): FinancialMonthInfo | undefined => {
  const dateWithTimezone = date.tz(financialTimezone)

  const year = dateWithTimezone.year()
  const month = dateWithTimezone.month() + 1

  const financialYear = month < 4 ? year - 1 : year

  return parseSchema(FinancialMonthInfoSchema, {
    financialYear,
    month,
  }).match(
    (validated) => validated,
    () => undefined,
  )
}
