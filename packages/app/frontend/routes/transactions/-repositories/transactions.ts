import { client } from '@frontend/lib/client'
import type { InferRequestType, InferResponseType } from 'hono/client'

export type TransactionItem = InferResponseType<
  typeof client.transactions.$get,
  200
>['transactions'][number]

const fetchTransactions = async (): Promise<TransactionItem[]> => {
  const response = await client.transactions.$get()
  if (!response.ok) {
    throw new Error('取引の取得に失敗しました')
  }
  const data = await response.json()
  return data.transactions
}

export const listTransactionsQueryOptions = () => ({
  queryKey: ['transactions'] as const,
  queryFn: fetchTransactions,
})

export const createTransaction = async (
  body: InferRequestType<typeof client.transactions.$post>['json'],
): Promise<TransactionItem> => {
  const response = await client.transactions.$post({ json: body })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      'message' in error ? error.message : '取引の作成に失敗しました',
    )
  }
  const data = await response.json()
  return data.transaction
}

export const updateTransaction = async (
  id: string,
  body: InferRequestType<(typeof client.transactions)[':id']['$put']>['json'],
): Promise<TransactionItem> => {
  const response = await client.transactions[':id'].$put({
    param: { id },
    json: body,
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      'message' in error ? error.message : '取引の更新に失敗しました',
    )
  }
  const data = await response.json()
  return data.transaction
}

export const deleteTransaction = async (
  id: string,
): Promise<TransactionItem> => {
  const response = await client.transactions[':id'].$delete({
    param: { id },
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      'message' in error ? error.message : '取引の削除に失敗しました',
    )
  }
  const data = await response.json()
  return data.transaction
}
