import type { Brand } from '@backend/lib/brand'
import type { Dayjs } from '@backend/lib/date'
import dayjs from '@backend/lib/date'
import { ulid } from 'ulid'

import type { CategoryId } from './category'
import type { EventId } from './event'

export type TransactionId = Brand<string, 'transaction_id'>
export type TransactionType = 'income' | 'expense'

export type Transaction = {
  id: TransactionId
  type: TransactionType
  amount: number
  categoryId: CategoryId
  transactionDate: Dayjs
  eventId: EventId | null
  name: string
  createdAt: Dayjs
}

export const createTransaction = (
  props: Omit<Transaction, 'id' | 'createdAt'>,
): Transaction => ({
  id: ulid() as TransactionId,
  createdAt: dayjs(),
  ...props,
})
