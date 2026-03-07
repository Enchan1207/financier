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
import { formatCurrency } from '@frontend/lib/mock-data'
import type React from 'react'
import { useState } from 'react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 現在の積立残高（上限として使用） */
  balance: number
  onWithdraw: (amount: number, memo: string) => void
}

export const SavingWithdrawalDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  balance,
  onWithdraw,
}) => {
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')

  const parsedAmount = parseInt(amount, 10)
  const isValid =
    !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= balance

  const handleSubmit = () => {
    if (!isValid) return
    onWithdraw(parsedAmount, memo)
    setAmount('')
    setMemo('')
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setAmount('')
      setMemo('')
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>積立を取り崩す</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="withdrawal-amount">取り崩し額 *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ¥
              </span>
              <Input
                id="withdrawal-amount"
                type="number"
                min="1"
                max={balance}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                }}
                className="pl-7"
                placeholder="10000"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              上限: {formatCurrency(balance)}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="withdrawal-memo">メモ（任意）</Label>
            <Input
              id="withdrawal-memo"
              value={memo}
              onChange={(e) => {
                setMemo(e.target.value)
              }}
              placeholder="例：旅行費用として使用"
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
            取り崩す
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
