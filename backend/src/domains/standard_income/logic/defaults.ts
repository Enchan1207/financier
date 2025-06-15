import { Result } from 'neverthrow'

import type dayjs from '@/logic/dayjs'

import type { StandardIncomeGrade } from '..'
import { createStandardIncomeGrade } from '.'

/**
 * 令和7年標準報酬月額等級
 * @see https://www.kyoukaikenpo.or.jp/~/media/Files/shared/hokenryouritu/r7/ippan/20nagano.pdf
 */
const reiwa7StandardIncomeGrades = [
  { threshold: 0, standardIncome: 58000 },
  { threshold: 68000, standardIncome: 63000 },
  { threshold: 78000, standardIncome: 73000 },
  { threshold: 88000, standardIncome: 83000 },
  { threshold: 98000, standardIncome: 93000 },
  { threshold: 104000, standardIncome: 101000 },
  { threshold: 110000, standardIncome: 107000 },
  { threshold: 118000, standardIncome: 114000 },
  { threshold: 126000, standardIncome: 122000 },
  { threshold: 134000, standardIncome: 130000 },
  { threshold: 142000, standardIncome: 138000 },
  { threshold: 150000, standardIncome: 146000 },
  { threshold: 160000, standardIncome: 155000 },
  { threshold: 170000, standardIncome: 165000 },
  { threshold: 180000, standardIncome: 175000 },
  { threshold: 190000, standardIncome: 185000 },
  { threshold: 200000, standardIncome: 195000 },
  { threshold: 220000, standardIncome: 210000 },
  { threshold: 240000, standardIncome: 230000 },
  { threshold: 260000, standardIncome: 250000 },
  { threshold: 280000, standardIncome: 270000 },
  { threshold: 300000, standardIncome: 290000 },
  { threshold: 320000, standardIncome: 310000 },
  { threshold: 340000, standardIncome: 330000 },
  { threshold: 360000, standardIncome: 350000 },
  { threshold: 380000, standardIncome: 370000 },
  { threshold: 410000, standardIncome: 395000 },
  { threshold: 440000, standardIncome: 425000 },
  { threshold: 470000, standardIncome: 455000 },
  { threshold: 500000, standardIncome: 485000 },
  { threshold: 530000, standardIncome: 515000 },
  { threshold: 560000, standardIncome: 545000 },
  { threshold: 590000, standardIncome: 575000 },
  { threshold: 620000, standardIncome: 605000 },
  { threshold: 650000, standardIncome: 635000 },
  { threshold: 680000, standardIncome: 665000 },
  { threshold: 710000, standardIncome: 695000 },
  { threshold: 750000, standardIncome: 730000 },
  { threshold: 790000, standardIncome: 770000 },
  { threshold: 830000, standardIncome: 810000 },
  { threshold: 880000, standardIncome: 855000 },
  { threshold: 930000, standardIncome: 905000 },
  { threshold: 980000, standardIncome: 955000 },
  { threshold: 1030000, standardIncome: 1005000 },
  { threshold: 1090000, standardIncome: 1055000 },
  { threshold: 1150000, standardIncome: 1115000 },
  { threshold: 1210000, standardIncome: 1175000 },
  { threshold: 1270000, standardIncome: 1235000 },
  { threshold: 1330000, standardIncome: 1295000 },
  { threshold: 1390000, standardIncome: 1355000 },
]

/**
 * 与えられた時刻で有効な標準報酬月額表を得る
 * @param _ 日時
 * @returns 日時に基づく標準報酬月額等級
 */
export const getDefaultStandardIncomeGrades = (
  _: dayjs.Dayjs,
): Result<StandardIncomeGrade[], Error> => {
  // NOTE: 日付によって返すべきテーブルを変えるなどする。現時点では令和7年版のもののみ採用
  return Result.combine(
    reiwa7StandardIncomeGrades.map(createStandardIncomeGrade),
  )
}
