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
import { PencilIcon } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultName: string
  defaultDate: string
  onSave: (name: string, date: string) => void
}

export const EventEditDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  defaultName,
  defaultDate,
  onSave,
}) => {
  const [formName, setFormName] = useState(defaultName)
  const [formDate, setFormDate] = useState(defaultDate)

  useEffect(() => {
    if (open) {
      setFormName(defaultName)
      setFormDate(defaultDate)
    }
  }, [open, defaultName, defaultDate])

  const handleSubmit = () => {
    if (!formName.trim() || !formDate) return
    onSave(formName.trim(), formDate)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PencilIcon />
          編集
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>イベントを編集</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-ev-name">イベント名 *</Label>
            <Input
              id="edit-ev-name"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value)
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-ev-date">発生日 *</Label>
            <Input
              id="edit-ev-date"
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
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
