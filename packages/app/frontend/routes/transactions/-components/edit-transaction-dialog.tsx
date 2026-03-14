import { Button } from '@frontend/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog'
import { Loader2Icon } from 'lucide-react'

import { categories, events } from '../-lib/mock-data'
import type { Transaction } from '../index'
import {
  TransactionFormFields,
  useTransactionForm,
} from './transaction-form-fields'

type EditTransactionDialogProps = {
  transaction: Transaction
  open: boolean
  onOpenChange: (v: boolean) => void
  onSave: (t: Transaction) => Promise<void>
}

export const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({
  transaction,
  open,
  onOpenChange,
  onSave,
}) => {
  const form = useTransactionForm(
    {
      type: transaction.type,
      categoryId: transaction.categoryId,
      amount: String(transaction.amount),
      name: transaction.name,
      transactionDate: transaction.transactionDate,
      eventId: transaction.eventId ?? '',
    },
    async (values) => {
      const selectedCategory = categories.find(
        (c) => c.id === values.categoryId,
      )
      const selectedEvent = events.find((e) => e.id === values.eventId)
      await onSave({
        ...transaction,
        type: values.type,
        categoryId: values.categoryId,
        categoryName: selectedCategory?.name ?? '',
        amount: Number(values.amount),
        name: values.name,
        transactionDate: values.transactionDate,
        eventId: values.eventId || undefined,
        eventName: selectedEvent?.name,
      })
    },
  )

  const handleOpenChange = (v: boolean) => {
    if (form.state.isSubmitting) return
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>取引を編集</DialogTitle>
        </DialogHeader>
        <TransactionFormFields form={form} />
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting] as const}
          children={([canSubmit, isSubmitting]) => (
            <Button
              className="w-full"
              disabled={!canSubmit || isSubmitting}
              onClick={() => form.handleSubmit()}
            >
              <Loader2Icon
                className={`animate-spin ${isSubmitting ? '' : 'hidden'}`}
              />
              保存する
            </Button>
          )}
        />
      </DialogContent>
    </Dialog>
  )
}
