import type { Brand } from '@backend/lib/brand'
import type { Dayjs } from '@backend/lib/date'
import dayjs from '@backend/lib/date'
import { ulid } from 'ulid'

import type { CategoryId } from './category'
import type { EventId } from './event'
import type { UserId } from './user'

export type TransactionId = Brand<string, 'transaction_id'>
export type TransactionType = 'income' | 'expense'

export type Transaction = {
  id: TransactionId
  userId: UserId
  /** 収支種別。categoryId が参照する Category.type と一致しなければならない */
  type: TransactionType
  /** 金額（日本円、正の整数） */
  amount: number
  /** 所属カテゴリ */
  categoryId: CategoryId
  /** 発生日。この値により年度帰属が決定される。未来日入力可 */
  transactionDate: Dayjs
  /** 紐づくイベント（任意） */
  eventId: EventId | null
  /** 取引を説明する名称。空文字・空白のみ不可 */
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
