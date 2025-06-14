import { Result } from 'neverthrow'
import { ulid } from 'ulid'

import dayjs from '@/logic/dayjs'
import { ValidationError } from '@/logic/errors'
import { parseSchema } from '@/logic/zod'

import type { WorkdayValue } from '../financial_month_context'
import { WorkdayValueSchema } from '../financial_month_context'
import type { FinancialMonthContext, FinancialMonthInfo } from '.'
import { FinancialMonthInfoSchema } from '.'

const financialTimezone = 'Asia/Tokyo'

export const createFinancialMonthInfo = (input: {
  financialYear: number
  month: number
}): Result<FinancialMonthInfo, ValidationError> =>
  parseSchema(FinancialMonthInfoSchema, input).mapErr(
    () => new ValidationError(),
  )

export const createWorkday = (
  input: number,
): Result<WorkdayValue, ValidationError> =>
  parseSchema(WorkdayValueSchema, input).mapErr(() => new ValidationError())

export const createFinancialMonthContext = (props: {
  userId: string
  financialYear: number
  month: number
  workday: number
  standardIncomeTableId: string
}): Result<FinancialMonthContext, ValidationError> => {
  const { userId, month, financialYear, workday, standardIncomeTableId } = props

  return Result.combine([
    createFinancialMonthInfo({ financialYear, month }),
    createWorkday(workday),
  ]).map(([info, workday]) => ({
    id: ulid(),
    userId,
    info,
    standardIncomeTableId,
    workday,
  }))
}

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
