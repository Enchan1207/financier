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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, dateRange?: { start: string; end?: string }) => void
}

export const EventCreateDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  onCreate,
}) => {
  const [formName, setFormName] = useState('')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')

  const handleSubmit = () => {
    if (!formName.trim()) return
    onCreate(
      formName.trim(),
      formStart ? { start: formStart, end: formEnd || undefined } : undefined,
    )
    setFormName('')
    setFormStart('')
    setFormEnd('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon />
          新規作成
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>イベントを新規作成</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ev-name">イベント名 *</Label>
            <Input
              id="ev-name"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value)
              }}
              placeholder="例：春ライブ遠征"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-start">開始日</Label>
            <Input
              id="ev-start"
              type="date"
              value={formStart}
              onChange={(e) => {
                setFormStart(e.target.value)
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-end">終了日</Label>
            <Input
              id="ev-end"
              type="date"
              value={formEnd}
              onChange={(e) => {
                setFormEnd(e.target.value)
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!formName.trim()}>
            作成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
