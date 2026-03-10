import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@frontend/components/ui/alert-dialog'
import { Button } from '@frontend/components/ui/button'
import { Checkbox } from '@frontend/components/ui/checkbox'
import { Label } from '@frontend/components/ui/label'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  year: string
  onConfirm: (copyBudget: boolean) => Promise<void>
}

export const FiscalYearCloseDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  year,
  onConfirm,
}) => {
  const [copyBudget, setCopyBudget] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const nextYear = String(Number(year) + 1)

  const handleOpenChange = (value: boolean) => {
    if (isSubmitting) return
    if (!value) setCopyBudget(false)
    onOpenChange(value)
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm(copyBudget)
      setCopyBudget(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{year}年度を締める</AlertDialogTitle>
          <AlertDialogDescription>
            この操作を行うと、当該年度のトランザクションと予算が編集・削除できなくなります。
            <span className="text-destructive">この操作は元に戻せません。</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center gap-2">
          <Checkbox
            id="copy-budget"
            checked={copyBudget}
            disabled={isSubmitting}
            onCheckedChange={(checked) => {
              setCopyBudget(checked === true)
            }}
          />
          <Label htmlFor="copy-budget">
            翌{nextYear}年度の予算設定として前年度の設定をコピーする
          </Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            キャンセル
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isSubmitting}
            onClick={() => {
              void handleConfirm()
            }}
          >
            {isSubmitting && <Loader2Icon className="animate-spin" />}
            締める
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
