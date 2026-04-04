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
import type React from 'react'

import type { Category } from '../index'

type DeleteCategoryDialogProps = {
  category: Category | null
  onOpenChange: (open: boolean) => void
  onDelete: (category: Category) => Promise<void>
}

export const DeleteCategoryDialog: React.FC<DeleteCategoryDialogProps> = ({
  category,
  onOpenChange,
  onDelete,
}) => (
  <AlertDialog open={category !== null} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>カテゴリを削除しますか？</AlertDialogTitle>
        <AlertDialogDescription>
          「{category?.name}
          」を削除します。トランザクション・予算・積立定義から参照されている場合は削除できません。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>キャンセル</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => {
            if (category) void onDelete(category)
          }}
        >
          削除
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
