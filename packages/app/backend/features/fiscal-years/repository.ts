import type { FiscalYear, FiscalYearId } from '@backend/domains/fiscal-year'
import type { UserId } from '@backend/domains/user'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { fiscalYearsTable } from '@backend/schemas/fiscal-years'
import { and, eq } from 'drizzle-orm'

const createFiscalYearModel = (record: {
  id: string
  user_id: string
  year: number
  status: string
}): FiscalYear => ({
  id: record.id as FiscalYearId,
  userId: record.user_id as UserId,
  year: record.year,
  status: record.status as FiscalYear['status'],
})

export const findFiscalYearByYear =
  (db: DrizzleDatabase) =>
  async (userId: UserId, year: number): Promise<FiscalYear | undefined> => {
    const results = await db
      .select()
      .from(fiscalYearsTable)
      .where(
        and(
          eq(fiscalYearsTable.user_id, userId),
          eq(fiscalYearsTable.year, year),
        ),
      )
    const row = results[0]
    return row ? createFiscalYearModel(row) : undefined
  }

export const findFiscalYearById =
  (db: DrizzleDatabase) =>
  async (id: FiscalYearId, userId: UserId): Promise<FiscalYear | undefined> => {
    const results = await db
      .select()
      .from(fiscalYearsTable)
      .where(
        and(eq(fiscalYearsTable.id, id), eq(fiscalYearsTable.user_id, userId)),
      )
    const row = results[0]
    return row ? createFiscalYearModel(row) : undefined
  }

export const saveFiscalYear =
  (db: DrizzleDatabase) =>
  async (fiscalYear: FiscalYear): Promise<void> => {
    await db
      .insert(fiscalYearsTable)
      .values({
        id: fiscalYear.id,
        user_id: fiscalYear.userId,
        year: fiscalYear.year,
        status: fiscalYear.status,
      })
      .onConflictDoUpdate({
        target: fiscalYearsTable.id,
        set: {
          status: fiscalYear.status,
        },
      })
  }
