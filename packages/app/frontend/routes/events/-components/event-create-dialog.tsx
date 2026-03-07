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
  onCreate: (name: string, occurredOn: string) => void
}

export const EventCreateDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  onCreate,
}) => {
  const [formName, setFormName] = useState('')
  const [formDate, setFormDate] = useState('')

  const handleSubmit = () => {
    if (!formName.trim() || !formDate) return
    onCreate(formName.trim(), formDate)
    setFormName('')
    setFormDate('')
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
            <Label htmlFor="ev-date">発生日 *</Label>
            <Input
              id="ev-date"
              type="date"
              value={formDate}
              onChange={(e) => {
                setFormDate(e.target.value)
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!formName.trim() || !formDate}
          >
            作成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
