import { Button } from '@frontend/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog'
import dayjs from '@frontend/lib/date'
import type React from 'react'
import { useState } from 'react'

export type LinkableTransaction = {
  id: string
  date: string
  name: string
  categoryName: string
  amount: number
}

const formatDate = (dateStr: string) => dayjs(dateStr).format('M/D')
const formatCurrency = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  alreadyLinkedIds: string[]
  availableTransactions: LinkableTransaction[]
  onLink: (txId: string) => Promise<void>
}

export const EventLinkTransactionDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  alreadyLinkedIds,
  availableTransactions,
  onLink,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const available = availableTransactions.filter(
    (tx) => !alreadyLinkedIds.includes(tx.id),
  )

  const handleSubmit = async () => {
    if (!selectedId) return
    setIsSubmitting(true)
    try {
      await onLink(selectedId)
      setSelectedId(null)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setSelectedId(null)
        onOpenChange(o)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>既存のトランザクションを追加</DialogTitle>
        </DialogHeader>
        {available.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            追加できるトランザクションがありません
          </p>
        ) : (
          <div className="divide-y rounded-md border">
            {available.map((tx) => (
              <button
                key={tx.id}
                type="button"
                onClick={() => {
                  setSelectedId(tx.id)
                }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent ${
                  selectedId === tx.id ? 'bg-accent' : ''
                }`}
              >
                <div>
                  <p className="font-medium">{tx.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(tx.date)}&nbsp;·&nbsp;{tx.categoryName}
                  </p>
                </div>
                <span className="font-mono">{formatCurrency(tx.amount)}</span>
              </button>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!selectedId || isSubmitting}>
            追加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
