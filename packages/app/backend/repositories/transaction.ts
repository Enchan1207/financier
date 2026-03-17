import type { CategoryId } from '@backend/domains/category'
import type { EventId } from '@backend/domains/event'
import type {
  Transaction,
  TransactionId,
  TransactionType,
} from '@backend/domains/transaction'
import dayjs from '@backend/lib/date'
import type { transactionsTable } from '@backend/schemas/transactions'
import type { InferSelectModel } from 'drizzle-orm'

type TransactionRecord = InferSelectModel<typeof transactionsTable>

export const createTransactionModel = (
  record: TransactionRecord,
): Transaction => ({
  id: record.id as TransactionId,
  type: record.type as TransactionType,
  amount: record.amount,
  categoryId: record.category_id as CategoryId,
  eventId: record.event_id ? (record.event_id as EventId) : null,
  name: record.name,
  transactionDate: dayjs(record.transaction_date),
  createdAt: dayjs(record.created_at),
})
