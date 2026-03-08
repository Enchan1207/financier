import { Button } from '@frontend/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog'
import { Input } from '@frontend/components/ui/input'
import { Label } from '@frontend/components/ui/label'
import dayjs from '@frontend/lib/date'
import { formatCurrency } from '@frontend/lib/format'
import { TODAY } from '@frontend/lib/today'
import type React from 'react'
import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryName: string
  balance: number
  onContribute: (amount: number, date: string, name: string) => void
}

export const SavingContributionDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  categoryName,
  balance,
  onContribute,
}) => {
  const defaultName = `${dayjs(TODAY).format('M')}月分積立`

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(TODAY)
  const [name, setName] = useState(defaultName)

  // ダイアログを開くたびに初期値にリセット
  useEffect(() => {
    if (open) {
      setAmount('')
      setDate(TODAY)
      setName(defaultName)
    }
  }, [open, defaultName])

  const parsedAmount = parseInt(amount, 10)
  const isValid =
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    date.length > 0 &&
    date <= TODAY &&
    name.trim().length > 0

  const handleSubmit = () => {
    if (!isValid) return
    onContribute(parsedAmount, date, name.trim())
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setAmount('')
      setDate(TODAY)
      setName(defaultName)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>積立に拠出する</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            カテゴリ:{' '}
            <span className="font-medium text-foreground">{categoryName}</span>
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="contribution-amount">金額 *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ¥
              </span>
              <Input
                id="contribution-amount"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                }}
                className="pl-7"
                placeholder="10000"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              現在の積立残高: {formatCurrency(balance)}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contribution-date">日付 *</Label>
            <Input
              id="contribution-date"
              type="date"
              max={TODAY}
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
              }}
            />
            <p className="text-xs text-muted-foreground">
              当日または過去日を指定してください。
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contribution-name">内容 *</Label>
            <Input
              id="contribution-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
              }}
              placeholder="例：3月分積立"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              handleOpenChange(false)
            }}
          >
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            拠出する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
