import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@frontend/components/ui/alert-dialog'

import type { Transaction } from '../index'

type DeleteTransactionDialogProps = {
  transaction: Transaction | null
  onOpenChange: (v: boolean) => void
  onConfirm: () => void
}

export const DeleteTransactionDialog: React.FC<
  DeleteTransactionDialogProps
> = ({ transaction, onOpenChange, onConfirm }) => (
  <AlertDialog open={transaction !== null} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>取引を削除しますか？</AlertDialogTitle>
        <AlertDialogDescription>
          「{transaction?.name}」を削除します。この操作は元に戻せません。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>キャンセル</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>削除</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
