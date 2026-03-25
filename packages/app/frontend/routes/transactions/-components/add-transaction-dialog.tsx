import { Button } from '@frontend/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog'
import { TODAY } from '@frontend/lib/today'
import { Loader2Icon, Plus } from 'lucide-react'
import { useState } from 'react'

import type {
  FormCategory,
  FormEvent,
  TransactionFormValues,
} from './transaction-form-fields'
import {
  TransactionFormFields,
  useTransactionForm,
} from './transaction-form-fields'

type AddTransactionDialogProps = {
  categories: FormCategory[]
  events: FormEvent[]
  onAdd: (values: TransactionFormValues) => Promise<void>
}

export const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({
  categories,
  events,
  onAdd,
}) => {
  const [open, setOpen] = useState(false)

  const form = useTransactionForm(
    {
      type: 'expense',
      categoryId: '',
      amount: '',
      name: '',
      transactionDate: TODAY,
      eventId: '',
    },
    async (values) => {
      await onAdd(values)
      setOpen(false)
    },
  )

  const handleOpenChange = (v: boolean) => {
    if (form.state.isSubmitting) return
    if (!v) form.reset()
    setOpen(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          追加
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>取引を追加</DialogTitle>
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
              記録する
            </Button>
          )}
        />
      </DialogContent>
    </Dialog>
  )
}
