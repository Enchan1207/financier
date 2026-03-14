import { CategoryIcon } from '@frontend/components/category/category-icon'
import type { CategoryColor } from '@frontend/components/category/types'
import {
  CategoryColors,
  CategoryIcons,
} from '@frontend/components/category/types'
import { Field, FieldError, FieldLabel } from '@frontend/components/ui/field'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@frontend/components/ui/toggle-group'
import type React from 'react'

// 各 CategoryColor に対応する背景色クラス（Tailwind JIT スキャン用にリテラルで列挙）
const colorBgClass: Record<CategoryColor, string> = {
  red: 'bg-[var(--category-red)]',
  orange: 'bg-[var(--category-orange)]',
  yellow: 'bg-[var(--category-yellow)]',
  green: 'bg-[var(--category-green)]',
  teal: 'bg-[var(--category-teal)]',
  blue: 'bg-[var(--category-blue)]',
  purple: 'bg-[var(--category-purple)]',
  pink: 'bg-[var(--category-pink)]',
}

type Props = {
  icon: string
  color: string
  onIconChange: (v: string) => void
  onColorChange: (v: string) => void
  onBlur?: () => void
  isColorInvalid?: boolean
  isIconInvalid?: boolean
  colorErrors?: Array<{ message?: string } | undefined>
  iconErrors?: Array<{ message?: string } | undefined>
}

export const CategoryAppearanceSelector: React.FC<Props> = ({
  icon,
  color,
  onIconChange,
  onColorChange,
  onBlur,
  isColorInvalid = false,
  isIconInvalid = false,
  colorErrors,
  iconErrors,
}) => {
  return (
    <>
      {/* 色選択 */}
      <Field data-invalid={isColorInvalid}>
        <FieldLabel>色</FieldLabel>
        <ToggleGroup
          type="single"
          value={color}
          onValueChange={(v) => {
            if (v) onColorChange(v)
          }}
          onBlur={onBlur}
          className="flex-wrap justify-start gap-2"
        >
          {CategoryColors.map((c) => (
            <ToggleGroupItem
              key={c}
              value={c}
              className={`size-7 rounded-full p-0 ${colorBgClass[c]} data-[state=on]:ring-2 data-[state=on]:ring-offset-2 data-[state=on]:ring-foreground`}
            />
          ))}
        </ToggleGroup>
        {isColorInvalid && colorErrors && <FieldError errors={colorErrors} />}
      </Field>

      {/* アイコン選択 */}
      <Field data-invalid={isIconInvalid}>
        <FieldLabel>アイコン</FieldLabel>
        <ToggleGroup
          type="single"
          value={icon}
          onValueChange={(v) => {
            if (v) onIconChange(v)
          }}
          onBlur={onBlur}
          className="flex-wrap justify-start"
        >
          {CategoryIcons.map((iconName) => (
            <ToggleGroupItem
              key={iconName}
              value={iconName}
              size="sm"
              className="size-9 p-0"
            >
              <CategoryIcon
                icon={iconName}
                color={(color || 'blue') as CategoryColor}
                className="size-4"
              />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {isIconInvalid && iconErrors && <FieldError errors={iconErrors} />}
      </Field>
    </>
  )
}
