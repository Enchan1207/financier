import { CategoryIcon } from '@frontend/components/category/category-icon'
import type {
  CategoryColor,
  CategoryIconType,
} from '@frontend/components/category/types'
import { Button } from '@frontend/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@frontend/components/ui/field'
import { Input } from '@frontend/components/ui/input'
import { useForm } from '@tanstack/react-form'
import { Loader2Icon } from 'lucide-react'
import type React from 'react'
import { z } from 'zod'

import type { Category } from '../index'
import { CategoryAppearanceSelector } from './category-appearance-selector'

const editCategorySchema = z.object({
  name: z.string().min(1, 'カテゴリ名を入力してください'),
  icon: z.string().min(1, 'アイコンを選択してください'),
  color: z.string().min(1, '色を選択してください'),
})

type Props = {
  category: Category
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (category: Category) => Promise<void>
}

export const EditCategoryDialog: React.FC<Props> = ({
  category,
  open,
  onOpenChange,
  onSave,
}) => {
  const form = useForm({
    defaultValues: {
      name: category.name,
      icon: category.icon as string,
      color: category.color as string,
    },
    validators: { onChange: editCategorySchema },
    onSubmit: async ({
      value,
    }: {
      value: { name: string; icon: string; color: string }
    }) => {
      await onSave({
        ...category,
        name: value.name.trim(),
        icon: value.icon as CategoryIconType,
        color: value.color as CategoryColor,
      })
      onOpenChange(false)
    },
  })

  const handleOpenChange = (v: boolean) => {
    if (form.state.isSubmitting) return
    if (!v) form.reset()
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>カテゴリを編集</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
        >
          <FieldGroup>
            {/* プレビュー */}
            <form.Subscribe
              selector={(state) =>
                [
                  state.values.icon as CategoryIconType | '',
                  state.values.color as CategoryColor | '',
                  state.values.name,
                ] as const
              }
              children={([icon, color, name]) =>
                icon && color ? (
                  <div className="flex items-center gap-3 rounded-md border p-3">
                    <CategoryIcon
                      icon={icon}
                      color={color}
                      className="size-6"
                    />
                    <span className="text-sm font-medium">
                      {name || category.name}
                    </span>
                  </div>
                ) : null
              }
            />

            {/* カテゴリ名 */}
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>カテゴリ名</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value)
                      }}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />

            {/* 色・アイコン選択 */}
            <form.Field
              name="color"
              children={(colorField) => (
                <form.Field
                  name="icon"
                  children={(iconField) => (
                    <CategoryAppearanceSelector
                      icon={iconField.state.value}
                      color={colorField.state.value}
                      onIconChange={iconField.handleChange}
                      onColorChange={colorField.handleChange}
                      onBlur={() => {
                        colorField.handleBlur()
                        iconField.handleBlur()
                      }}
                      isColorInvalid={
                        colorField.state.meta.isTouched &&
                        !colorField.state.meta.isValid
                      }
                      isIconInvalid={
                        iconField.state.meta.isTouched &&
                        !iconField.state.meta.isValid
                      }
                      colorErrors={colorField.state.meta.errors}
                      iconErrors={iconField.state.meta.errors}
                    />
                  )}
                />
              )}
            />
          </FieldGroup>

          <form.Subscribe
            selector={(state) =>
              [
                state.values.name,
                state.values.icon,
                state.values.color,
                state.isSubmitting,
              ] as const
            }
            children={([name, icon, color, isSubmitting]) => (
              <DialogFooter className="mt-6">
                <Button
                  type="submit"
                  disabled={!name.trim() || !icon || !color || isSubmitting}
                >
                  <Loader2Icon
                    className={`animate-spin ${isSubmitting ? '' : 'hidden'}`}
                  />
                  保存
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSubmitting}
                  onClick={() => {
                    handleOpenChange(false)
                  }}
                >
                  キャンセル
                </Button>
              </DialogFooter>
            )}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
