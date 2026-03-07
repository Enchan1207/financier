import { Button } from '@frontend/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog'
import { Field } from '@frontend/components/ui/field'
import { Input } from '@frontend/components/ui/input'
import { Label } from '@frontend/components/ui/label'
import type { SavingDefinition } from '@frontend/lib/mock-data'
import { XIcon } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  saving: SavingDefinition
  onSave: (targetAmount: number, deadline: string) => void
}

export const SavingEditDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  saving,
  onSave,
}) => {
  const [targetAmount, setTargetAmount] = useState(
    saving.targetAmount?.toString() ?? '',
  )
  const [deadline, setDeadline] = useState(saving.deadline ?? '')

  // ダイアログを開くたびに現在値でリセット
  useEffect(() => {
    if (open) {
      setTargetAmount(saving.targetAmount?.toString() ?? '')
      setDeadline(saving.deadline ?? '')
    }
  }, [open, saving])

  const parsedAmount = parseInt(targetAmount, 10)
  const isValid = !isNaN(parsedAmount) && parsedAmount > 0

  const handleSave = () => {
    if (!isValid) return
    onSave(parsedAmount, deadline)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>積立設定を編集</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-target-amount">目標金額 *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ¥
              </span>
              <Input
                id="edit-target-amount"
                type="number"
                min="1"
                value={targetAmount}
                onChange={(e) => {
                  setTargetAmount(e.target.value)
                }}
                className="pl-7"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-deadline">期限（任意）</Label>
            <Field orientation="horizontal">
              <Input
                id="edit-deadline"
                type="date"
                value={deadline}
                onChange={(e) => {
                  setDeadline(e.target.value)
                }}
              />
              {deadline && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDeadline('')
                  }}
                  aria-label="期限をクリア"
                >
                  <XIcon />
                </Button>
              )}
            </Field>
            <p className="text-xs text-muted-foreground">
              期限を設定すると月次目安額が算出されます。
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false)
            }}
          >
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
