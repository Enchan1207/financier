import { CategoryIcon } from '@frontend/components/category/category-icon'
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
import { Pencil, Trash2 } from 'lucide-react'
import type React from 'react'

import type { Category } from '../index'

type CategoryTableProps = {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
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
