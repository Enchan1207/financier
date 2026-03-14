import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select'

import { CategoryIcon } from './category-icon'
import type { CategoryColor, CategoryIconType } from './types'

export type CategorySelectItem = {
  id: string
  name: string
  icon: CategoryIconType
  color: CategoryColor
}

type Props = {
  categories: CategorySelectItem[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  id?: string
  disabled?: boolean
  'aria-invalid'?: boolean
  className?: string
  onOpenChange?: (open: boolean) => void
}

export function CategorySelect({
  categories,
  value,
  onValueChange,
  placeholder = 'カテゴリを選択',
  id,
  disabled,
  'aria-invalid': ariaInvalid,
  className,
  onOpenChange,
}: Props) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      onOpenChange={onOpenChange}
    >
      <SelectTrigger id={id} className={className} aria-invalid={ariaInvalid}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {categories.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            <span className="flex items-center gap-2">
              <CategoryIcon
                icon={c.icon}
                color={c.color}
                className="size-4 shrink-0"
              />
              {c.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
