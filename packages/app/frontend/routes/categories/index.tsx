import type {
  CategoryColor,
  CategoryIconType,
} from '@frontend/components/category/types'
import { Button } from '@frontend/components/ui/button'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@frontend/components/ui/toggle-group'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { toast } from 'sonner'

import { CategoryTable } from './-components/category-table'
import { CreateCategoryDialog } from './-components/create-category-dialog'
import { DeleteCategoryDialog } from './-components/delete-category-dialog'
import { EditCategoryDialog } from './-components/edit-category-dialog'
import {
  createCategory,
  deleteCategory,
  listCategoriesQueryOptions,
  updateCategory,
} from './-repositories/categories'

export type CategoryType = 'income' | 'expense' | 'saving'

export type Category = {
  id: string
  type: CategoryType
  name: string
  icon: CategoryIconType
  color: CategoryColor
}

const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { data, isPending, isError } = useQuery(listCategoriesQueryOptions())
  const categories: Category[] = (data ?? []).map((c) => ({
    id: c.id,
    type: c.type as CategoryType,
    name: c.name,
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
    mutationFn: (data: Omit<Category, 'id'>) =>
      createCategory({
        type: data.type,
        name: data.name,
        icon: data.icon,
        color: data.color,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (error) => {
      toast.error(error.message)
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
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleCreate = async (data: Omit<Category, 'id'>): Promise<void> => {
    await createMutation.mutateAsync(data)
  }

  const handleSave = async (updated: Category): Promise<void> => {
    await updateMutation.mutateAsync(updated)
  }

  const handleDelete = async (category: Category): Promise<void> => {
    await deleteMutation.mutateAsync(category.id)
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
        ) : isError ? (
          <p className="py-8 text-center text-sm text-destructive">
            カテゴリの取得に失敗しました
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

      <DeleteCategoryDialog
        category={deletingCategory}
        onOpenChange={(v) => {
          if (!v) setDeletingCategory(null)
        }}
        onDelete={handleDelete}
      />
    </div>
  )
}

export const Route = createFileRoute('/categories/')({
  component: CategoriesPage,
})
