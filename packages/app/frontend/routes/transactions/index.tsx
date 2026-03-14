import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import type { TransactionType } from '@frontend/lib/types'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { AddTransactionDialog } from './-components/add-transaction-dialog'
import { DeleteTransactionDialog } from './-components/delete-transaction-dialog'
import { EditTransactionDialog } from './-components/edit-transaction-dialog'
import { TransactionTable } from './-components/transaction-table'
import { INITIAL_TRANSACTIONS } from './-lib/mock-data'

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
  const [transactions, setTransactions] =
    useState<Transaction[]>(INITIAL_TRANSACTIONS)
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] =
    useState<Transaction | null>(null)

  const handleAdd = async (t: Transaction): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    setTransactions((prev) => [...prev, t])
  }

  const handleSave = async (updated: Transaction): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    setTransactions((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t)),
    )
    setEditingTransaction(null)
  }

  const handleDelete = () => {
    if (!deletingTransaction) return
    setTransactions((prev) =>
      prev.filter((t) => t.id !== deletingTransaction.id),
    )
    setDeletingTransaction(null)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Card className="flex flex-col flex-1 min-h-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">取引一覧</CardTitle>
            <AddTransactionDialog onAdd={handleAdd} />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-1 md:px-6">
          <TransactionTable
            transactions={transactions}
            onEdit={setEditingTransaction}
            onDelete={setDeletingTransaction}
          />
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
          onSave={handleSave}
        />
      )}

      <DeleteTransactionDialog
        transaction={deletingTransaction}
        onOpenChange={(v) => {
          if (!v) setDeletingTransaction(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export const Route = createFileRoute('/transactions/')({
  component: TransactionsPage,
})
