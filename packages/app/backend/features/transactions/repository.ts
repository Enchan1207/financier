import type { Transaction, TransactionId } from '@backend/domains/transaction'
import type { UserId } from '@backend/domains/user'
import type { DrizzleDatabase } from '@backend/lib/drizzle'
import { createTransactionModel } from '@backend/repositories/transaction'
import { transactionsTable } from '@backend/schemas/transactions'
import { and, between, eq } from 'drizzle-orm'

export const findTransactions =
  (db: DrizzleDatabase) =>
  async (userId: UserId): Promise<Transaction[]> => {
    const results = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.user_id, userId))
    return results.map(createTransactionModel)
  }

export const findTransactionById =
  (db: DrizzleDatabase) =>
  async (
    id: TransactionId,
    userId: UserId,
  ): Promise<Transaction | undefined> => {
    const results = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.id, id),
          eq(transactionsTable.user_id, userId),
        ),
      )

    const row = results[0]
    return row ? createTransactionModel(row) : undefined
  }

export const saveTransaction =
  (db: DrizzleDatabase) =>
  async (transaction: Transaction): Promise<void> => {
    await db
      .insert(transactionsTable)
      .values({
        id: transaction.id,
        user_id: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        category_id: transaction.categoryId,
        event_id: transaction.eventId,
        name: transaction.name,
        transaction_date: transaction.transactionDate.format('YYYY-MM-DD'),
        created_at: transaction.createdAt.toISOString(),
      })
      .onConflictDoUpdate({
        target: transactionsTable.id,
        set: {
          type: transaction.type,
          amount: transaction.amount,
          category_id: transaction.categoryId,
          event_id: transaction.eventId,
          name: transaction.name,
          transaction_date: transaction.transactionDate.format('YYYY-MM-DD'),
        },
      })
  }

export const deleteTransaction =
  (db: DrizzleDatabase) =>
  async (id: TransactionId): Promise<void> => {
    await db.delete(transactionsTable).where(eq(transactionsTable.id, id))
  }

export const findTransactionsByFiscalYear =
  (db: DrizzleDatabase) =>
  async (userId: UserId, year: number): Promise<Transaction[]> => {
    const startDate = `${year}-04-01`
    const endDate = `${year + 1}-03-31`
    const results = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.user_id, userId),
          between(transactionsTable.transaction_date, startDate, endDate),
        ),
      )
    return results.map(createTransactionModel)
  }
