import { CategoryIcon } from '@frontend/components/category/category-icon'
import type {
  CategoryColor,
  CategoryIconType,
} from '@frontend/components/category/types'
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
import { Badge } from '@frontend/components/ui/badge'
import { Button } from '@frontend/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@frontend/components/ui/table'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@frontend/components/ui/toggle-group'
import {
  archiveCategory,
  createCategory,
  listCategoriesQueryOptions,
  updateCategory,
} from '@frontend/repositories/categories'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

import { CreateCategoryDialog } from './-components/create-category-dialog'
import { EditCategoryDialog } from './-components/edit-category-dialog'

export type CategoryType = 'income' | 'expense' | 'saving'
export type CategoryStatus = 'active' | 'archived'

export type Category = {
  id: string
  type: CategoryType
  name: string
  status: CategoryStatus
  icon: CategoryIconType
  color: CategoryColor
}

const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { data, isPending } = useQuery(listCategoriesQueryOptions())
  const categories: Category[] = (data ?? []).map((c) => ({
    id: c.id,
    type: c.type as CategoryType,
    name: c.name,
    status: c.status as CategoryStatus,
    icon: c.icon as CategoryIconType,
    color: c.color as CategoryColor,
  }))

  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  )

  const createMutation = useMutation({
    mutationFn: (data: Omit<Category, 'id' | 'status'>) =>
      createCategory({
        type: data.type,
        name: data.name,
        icon: data.icon,
        color: data.color,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (category: Category) =>
      updateCategory(category.id, {
        name: category.name,
        icon: category.icon,
        color: category.color,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const handleCreate = async (
    data: Omit<Category, 'id' | 'status'>,
  ): Promise<void> => {
    await createMutation.mutateAsync(data)
  }

  const handleSave = async (updated: Category): Promise<void> => {
    await updateMutation.mutateAsync(updated)
  }

  const handleDelete = async (category: Category): Promise<void> => {
    await archiveMutation.mutateAsync(category.id)
    setDeletingCategory(null)
  }

  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter(
    (c) => c.type === 'expense' || c.type === 'saving',
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">カテゴリ</h1>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            value={activeTab}
            onValueChange={(v) => {
              if (v) setActiveTab(v as 'income' | 'expense')
            }}
            className="w-full md:w-auto"
          >
            <ToggleGroupItem
              value="expense"
              className="flex-1 md:flex-none md:min-w-[100px]"
            >
              支出
            </ToggleGroupItem>
            <ToggleGroupItem
              value="income"
              className="flex-1 md:flex-none md:min-w-[100px]"
            >
              収入
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            size="sm"
            onClick={() => {
              setCreateDialogOpen(true)
            }}
          >
            <Plus />
            新規作成
          </Button>
        </div>

        {isPending ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            読み込み中...
          </p>
        ) : (
          <CategoryTable
            categories={
              activeTab === 'expense' ? expenseCategories : incomeCategories
            }
            onEdit={setEditingCategory}
            onDelete={setDeletingCategory}
          />
        )}
      </div>

      <CreateCategoryDialog
        type={activeTab}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreate}
      />

      {editingCategory && (
        <EditCategoryDialog
          key={editingCategory.id}
          category={editingCategory}
          open={true}
          onOpenChange={(v) => {
            if (!v) setEditingCategory(null)
          }}
          onSave={handleSave}
        />
      )}

      <AlertDialog
        open={deletingCategory !== null}
        onOpenChange={(v) => {
          if (!v) setDeletingCategory(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>カテゴリを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deletingCategory?.name}
              」を削除します。削除後は新規取引の選択肢に表示されなくなります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingCategory) void handleDelete(deletingCategory)
              }}
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

type CategoryTableProps = {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  onEdit,
  onDelete,
}) => {
  if (categories.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        カテゴリがありません
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>カテゴリ名</TableHead>
          <TableHead></TableHead>
          <TableHead className="w-[100px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow
            key={category.id}
            className={category.status === 'archived' ? 'opacity-50' : ''}
          >
            <TableCell>
              <div className="flex items-center gap-2">
                <CategoryIcon
                  icon={category.icon}
                  className="size-4 shrink-0"
                  color={category.color}
                />
                {category.name}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                {category.type === 'saving' && (
                  <Badge variant="secondary">積立</Badge>
                )}
                {category.status === 'archived' && (
                  <Badge variant="outline">削除済み</Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              {category.status === 'active' && (
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onEdit(category)
                    }}
                    aria-label="編集"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onDelete(category)
                    }}
                    aria-label="削除"
                  >
                    <Trash2 />
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export const Route = createFileRoute('/categories/')({
  component: CategoriesPage,
})
