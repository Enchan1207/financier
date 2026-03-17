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
import { Link } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'
import type React from 'react'
import { z } from 'zod'

import type { Category } from '../index'
import { CategoryAppearanceSelector } from './category-appearance-selector'

const createCategorySchema = z.object({
  name: z.string().min(1, 'カテゴリ名を入力してください'),
  icon: z.string().min(1, 'アイコンを選択してください'),
  color: z.string().min(1, '色を選択してください'),
})

const typeLabel: Record<'income' | 'expense', string> = {
  expense: '支出',
  income: '収入',
}

type Props = {
  type: 'income' | 'expense'
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (category: Omit<Category, 'id' | 'status'>) => Promise<void>
}

export const CreateCategoryDialog: React.FC<Props> = ({
  type,
  open,
  onOpenChange,
  onCreate,
}) => {
  const form = useForm({
    defaultValues: { name: '', icon: '', color: '' },
    validators: { onChange: createCategorySchema },
    onSubmit: async ({
      value,
    }: {
      value: { name: string; icon: string; color: string }
    }) => {
      await onCreate({
        type,
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
          <DialogTitle>{typeLabel[type]}カテゴリを作成</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
        >
          <FieldGroup>
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
                      autoFocus
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
              <DialogFooter className="mt-6 flex-col gap-2 sm:flex-col">
                <p className="text-sm text-muted-foreground">
                  積立カテゴリを作成する場合は{' '}
                  <Button
                    asChild
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    disabled={isSubmitting}
                  >
                    <Link
                      to="/savings/new"
                      onClick={() => {
                        onOpenChange(false)
                      }}
                    >
                      こちら
                    </Link>
                  </Button>
                </p>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={!name.trim() || !icon || !color || isSubmitting}
                  >
                    <Loader2Icon
                      className={`animate-spin ${isSubmitting ? '' : 'hidden'}`}
                    />
                    作成
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
                </div>
              </DialogFooter>
            )}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
