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

const editCategorySchema = z.object({
  name: z.string().min(1, 'カテゴリ名を入力してください'),
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
    defaultValues: { name: category.name },
    validators: { onChange: editCategorySchema },
    onSubmit: async ({ value }: { value: { name: string } }) => {
      await onSave({ ...category, name: value.name.trim() })
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
          </FieldGroup>

          <form.Subscribe
            selector={(state) => [state.values.name, state.isSubmitting]}
            children={([name, isSubmitting]) => (
              <DialogFooter className="mt-6">
                <Button
                  type="submit"
                  disabled={
                    !(name as string).trim() || (isSubmitting as boolean)
                  }
                >
                  <Loader2Icon
                    className={`animate-spin ${(isSubmitting as boolean) ? '' : 'hidden'}`}
                  />
                  保存
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSubmitting as boolean}
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
