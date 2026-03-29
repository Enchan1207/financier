import type {
  CategoryColor,
  CategoryIconType,
} from '@frontend/components/category/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import type { TransactionType } from '@frontend/lib/types'
import { listCategoriesQueryOptions } from '@frontend/routes/categories/-repositories/categories'
import { listEventsQueryOptions } from '@frontend/routes/events/-repositories/events'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import { AddTransactionDialog } from './-components/add-transaction-dialog'
import { DeleteTransactionDialog } from './-components/delete-transaction-dialog'
import { EditTransactionDialog } from './-components/edit-transaction-dialog'
import type { TransactionFormValues } from './-components/transaction-form-fields'
import { TransactionTable } from './-components/transaction-table'
import { useTransactionMutations } from './-hooks/use-transaction-mutations'
import { listTransactionsQueryOptions } from './-repositories/transactions'

export type Transaction = {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  categoryName: string
  transactionDate: string
  name: string
  eventId?: string
  eventName?: string
}

const TransactionsPage: React.FC = () => {
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] =
    useState<Transaction | null>(null)

  const {
    data: transactionsData,
    isPending: txPending,
    isError: txError,
  } = useQuery(listTransactionsQueryOptions())
  const { data: categoriesData } = useQuery(listCategoriesQueryOptions())
  const { data: eventsData } = useQuery(listEventsQueryOptions())

  const { createMutation, updateMutation, deleteMutation } =
    useTransactionMutations(
      () => {
        setEditingTransaction(null)
      },
      () => {
        setDeletingTransaction(null)
      },
    )

  const transactions = useMemo<Transaction[]>(
    () =>
      (transactionsData ?? []).map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        categoryId: tx.categoryId,
        categoryName:
          categoriesData?.find((c) => c.id === tx.categoryId)?.name ?? '',
        transactionDate: tx.transactionDate,
        name: tx.name,
        eventId: tx.eventId ?? undefined,
        eventName:
          eventsData?.find((ev) => ev.id === tx.eventId)?.name ?? undefined,
      })),
    [transactionsData, categoriesData, eventsData],
  )

  const formEvents = useMemo(
    () =>
      (eventsData ?? []).map((ev) => ({
        id: ev.id,
        name: ev.name,
      })),
    [eventsData],
  )

  const formCategories = useMemo(
    () =>
      (categoriesData ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        icon: c.icon as CategoryIconType,
        color: c.color as CategoryColor,
      })),
    [categoriesData],
  )

  const tableCategories = useMemo(
    () =>
      (categoriesData ?? []).map((c) => ({
        id: c.id,
        icon: c.icon as CategoryIconType,
        color: c.color as CategoryColor,
      })),
    [categoriesData],
  )

  const handleAdd = async (values: TransactionFormValues): Promise<void> => {
    await createMutation.mutateAsync(values)
  }

  const handleSave = async (values: TransactionFormValues): Promise<void> => {
    if (!editingTransaction) return
    await updateMutation.mutateAsync({ id: editingTransaction.id, values })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Card className="flex flex-col flex-1 min-h-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">取引一覧</CardTitle>
            <AddTransactionDialog
              categories={formCategories}
              events={formEvents}
              onAdd={handleAdd}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-1 md:px-6">
          {txPending ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              読み込み中...
            </p>
          ) : txError ? (
            <p className="py-8 text-center text-sm text-destructive">
              取引の取得に失敗しました
            </p>
          ) : (
            <TransactionTable
              transactions={transactions}
              categories={tableCategories}
              onEdit={setEditingTransaction}
              onDelete={setDeletingTransaction}
            />
          )}
        </CardContent>
      </Card>

      {editingTransaction && (
        <EditTransactionDialog
          key={editingTransaction.id}
          transaction={editingTransaction}
          open={true}
          onOpenChange={(v) => {
            if (!v) setEditingTransaction(null)
          }}
          categories={formCategories}
          events={formEvents}
          onSave={handleSave}
        />
      )}

      <DeleteTransactionDialog
        transaction={deletingTransaction}
        onOpenChange={(v) => {
          if (!v) setDeletingTransaction(null)
        }}
        onConfirm={() => {
          if (deletingTransaction) deleteMutation.mutate(deletingTransaction.id)
        }}
      />
    </div>
  )
}

export const Route = createFileRoute('/transactions/')({
  component: TransactionsPage,
})
