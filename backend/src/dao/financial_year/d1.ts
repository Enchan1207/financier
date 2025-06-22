import type { FinancialYearValue } from '@/domains/financial_year'
import { condition, every } from '@/logic/query_builder/condition_tree'
import { d1 } from '@/logic/query_builder/d1'

import type { FinancialMonthRecord } from '../financial_month/schema'
import {
  FinancialMonthRecordSchema,
  makeFinancialMonthRecord,
} from '../financial_month/schema'
import { makeMonthlyContextEntity } from '../monthly_context/schema'
import type { FinancialYearDao } from '.'

export const insertFinancialYear =
  (db: D1Database): FinancialYearDao['insertFinancialYear'] =>
  async (entity) => {
    const monthRecords = entity.months.map(makeFinancialMonthRecord)

    const base = d1(db).insert(
      FinancialMonthRecordSchema,
      'financial_month_contexts',
    )
    const queries = monthRecords.map((record) => base.values(record).build())

    await db.batch(queries)

    return entity
  }

export const listFinancialYears =
  (db: D1Database): FinancialYearDao['listFinancialYears'] =>
  async (props) => {
    const order = props.order ?? 'asc'
    const stmt = `
    SELECT DISTINCT
        financial_year
    FROM
        financial_month_contexts
    WHERE
        user_id = ?
    ORDER BY
        financial_year ${order}
    `

    const result = await db
      .prepare(stmt)
      .bind(props.userId)
      .all<{ financial_year: FinancialYearValue }>()

    const financialYears = result.results.map(
      ({ financial_year }) => financial_year,
    )
    return financialYears
  }

export const getFinancialYear =
  (db: D1Database): FinancialYearDao['getFinancialYear'] =>
  async ({ userId, financialYear }) => {
    const stmt = d1(db)
      .select(FinancialMonthRecordSchema, 'financial_month_contexts')
      .where(
        every(
          condition('user_id', '==', userId),
          condition('financial_year', '==', financialYear),
        ),
      )
      .build()

    const { results } = await stmt.run<FinancialMonthRecord>()
    const months = results.map(makeMonthlyContextEntity)

    if (months.length === 0) {
      return undefined
    }

    return {
      year: financialYear,
      months,
    }
  }
