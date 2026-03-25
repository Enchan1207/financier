import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { TransactionFormValues } from '../-components/transaction-form-fields'
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '../-repositories/transactions'

export const useTransactionMutations = (
  onEditClose: () => void,
  onDeleteClose: () => void,
) => {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['transactions'] })

  const createMutation = useMutation({
    mutationFn: (values: TransactionFormValues) =>
      createTransaction({
        type: values.type,
        amount: Number(values.amount),
        categoryId: values.categoryId,
        transactionDate: values.transactionDate,
        name: values.name,
        eventId: values.eventId || null,
      }),
    onSuccess: () => {
      void invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string
      values: TransactionFormValues
    }) =>
      updateTransaction(id, {
        amount: Number(values.amount),
        categoryId: values.categoryId,
        transactionDate: values.transactionDate,
        name: values.name,
        eventId: values.eventId || null,
      }),
    onSuccess: () => {
      void invalidate()
      onEditClose()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      void invalidate()
      onDeleteClose()
    },
    onError: (error) => {
      toast.error(error.message)
      onDeleteClose()
    },
  })

  return { createMutation, updateMutation, deleteMutation }
}
