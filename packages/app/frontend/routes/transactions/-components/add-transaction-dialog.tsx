import { Button } from '@frontend/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog'
import dayjs from '@frontend/lib/date'
import { TODAY } from '@frontend/lib/today'
import { Loader2Icon, Plus } from 'lucide-react'
import { useState } from 'react'

import { categories, events } from '../-lib/mock-data'
import type { Transaction } from '../index'
import {
  TransactionFormFields,
  useTransactionForm,
} from './transaction-form-fields'

type AddTransactionDialogProps = {
  onAdd: (t: Transaction) => Promise<void>
}

export const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({
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
      const selectedCategory = categories.find(
        (c) => c.id === values.categoryId,
      )
      const selectedEvent = events.find((e) => e.id === values.eventId)
      await onAdd({
        id: `tx-${dayjs().valueOf()}`,
        type: values.type,
        categoryId: values.categoryId,
        categoryName: selectedCategory?.name ?? '',
        amount: Number(values.amount),
        name: values.name,
        transactionDate: values.transactionDate,
        eventId: values.eventId || undefined,
        eventName: selectedEvent?.name,
      })
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
              記録する
            </Button>
          )}
        />
      </DialogContent>
    </Dialog>
  )
}
