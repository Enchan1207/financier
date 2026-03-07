import { Button } from '@frontend/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog'
import { Input } from '@frontend/components/ui/input'
import { Label } from '@frontend/components/ui/label'
import { PlusIcon } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

export type NewTransaction = {
  date: string
  name: string
  categoryName: string
  amount: number
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (tx: NewTransaction) => void
}

export const EventAddTransactionDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  onAdd,
}) => {
  const [formDate, setFormDate] = useState('')
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formAmount, setFormAmount] = useState('')

  const isValid =
    !!formDate && !!formName.trim() && !!formCategory.trim() && !!formAmount

  const handleSubmit = () => {
    if (!isValid) return
    onAdd({
      date: formDate,
      name: formName.trim(),
      categoryName: formCategory.trim(),
      amount: Number(formAmount),
    })
    setFormDate('')
    setFormName('')
    setFormCategory('')
    setFormAmount('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PlusIcon />
          追加
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>イベントにトランザクションを追加</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="add-tx-date">日付 *</Label>
            <Input
              id="add-tx-date"
              type="date"
              value={formDate}
              onChange={(e) => {
                setFormDate(e.target.value)
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-tx-name">内容 *</Label>
            <Input
              id="add-tx-name"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value)
              }}
              placeholder="例：ライブチケット"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-tx-category">カテゴリ *</Label>
            <Input
              id="add-tx-category"
              value={formCategory}
              onChange={(e) => {
                setFormCategory(e.target.value)
              }}
              placeholder="例：娯楽・グッズ"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-tx-amount">金額 *</Label>
            <Input
              id="add-tx-amount"
              type="number"
              min={0}
              value={formAmount}
              onChange={(e) => {
                setFormAmount(e.target.value)
              }}
              placeholder="例：5000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!isValid}>
            追加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
