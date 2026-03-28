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

// モック：本番ではAPIから未紐付けトランザクション一覧を取得する
const UNLINKED_TRANSACTIONS = [
  {
    id: 'tx-u-1',
    date: '2026-02-10',
    name: 'コスメ購入',
    categoryName: '美容',
    amount: 3200,
  },
  {
    id: 'tx-u-2',
    date: '2026-02-18',
    name: 'カフェ代',
    categoryName: '外食',
    amount: 850,
  },
  {
    id: 'tx-u-3',
    date: '2026-02-22',
    name: 'ブロマイド',
    categoryName: '娯楽・グッズ',
    amount: 1200,
  },
  {
    id: 'tx-u-4',
    date: '2026-03-01',
    name: '交通費（バス）',
    categoryName: '交通費',
    amount: 400,
  },
  {
    id: 'tx-u-5',
    date: '2026-03-04',
    name: 'アクスタ',
    categoryName: '娯楽・グッズ',
    amount: 2000,
  },
]

export type LinkedTransaction = (typeof UNLINKED_TRANSACTIONS)[number]

const formatDate = (dateStr: string) => dayjs(dateStr).format('M/D')
const formatCurrency = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  alreadyLinkedIds: string[]
  onLink: (tx: LinkedTransaction) => void
}

export const EventLinkTransactionDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  alreadyLinkedIds,
  onLink,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const available = UNLINKED_TRANSACTIONS.filter(
    (tx) => !alreadyLinkedIds.includes(tx.id),
  )

  const handleSubmit = () => {
    const tx = available.find((t) => t.id === selectedId)
    if (!tx) return
    onLink(tx)
    setSelectedId(null)
    onOpenChange(false)
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
          <Button onClick={handleSubmit} disabled={!selectedId}>
            追加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
