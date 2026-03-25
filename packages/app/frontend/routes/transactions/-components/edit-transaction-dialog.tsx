import { Button } from '@frontend/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog'
import { Loader2Icon } from 'lucide-react'

import type { Transaction } from '../index'
import type {
  FormCategory,
  FormEvent,
  TransactionFormValues,
} from './transaction-form-fields'
import {
  TransactionFormFields,
  useTransactionForm,
} from './transaction-form-fields'

type EditTransactionDialogProps = {
  transaction: Transaction
  open: boolean
  onOpenChange: (v: boolean) => void
  categories: FormCategory[]
  events: FormEvent[]
  onSave: (values: TransactionFormValues) => Promise<void>
}

export const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({
  transaction,
  open,
  onOpenChange,
  categories,
  events,
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
      await onSave(values)
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
        <TransactionFormFields
          form={form}
          categories={categories}
          events={events}
        />
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
