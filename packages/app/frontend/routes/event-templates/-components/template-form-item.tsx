import type { CategorySelectItem } from '@frontend/components/category/category-select'
import { CategorySelect } from '@frontend/components/category/category-select'
import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import { Field, FieldError, FieldLabel } from '@frontend/components/ui/field'
import { Input } from '@frontend/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@frontend/components/ui/input-group'
import { Trash2Icon } from 'lucide-react'

import type { useTemplateForm } from './use-template-form'

type Props = {
  form: ReturnType<typeof useTemplateForm>
  index: number
  canRemove: boolean
  onRemove: () => void
  categories: CategorySelectItem[]
}

export const TemplateFormItem: React.FC<Props> = ({
  form,
  index,
  canRemove,
  onRemove,
  categories,
}) => (
  <Card>
    <CardHeader className="pb-2 pt-3 px-4">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm text-muted-foreground">
          取引 {index + 1}
        </CardTitle>
        {canRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2Icon className="size-4 text-destructive" />
          </Button>
        )}
      </div>
    </CardHeader>
    <CardContent className="px-4 pb-4 space-y-3">
      <form.Field
        name={`items[${index}].categoryId`}
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={`cat-${index}`}>カテゴリ</FieldLabel>
              <CategorySelect
                id={`cat-${index}`}
                className="w-full"
                aria-invalid={isInvalid}
                categories={categories}
                value={field.state.value}
                onValueChange={(v) => {
                  field.handleChange(v)
                }}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      <form.Field
        name={`items[${index}].name`}
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={`name-${index}`}>内容名</FieldLabel>
              <Input
                id={`name-${index}`}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  field.handleChange(e.target.value)
                }}
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      <form.Field
        name={`items[${index}].amount`}
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={`amount-${index}`}>
                デフォルト金額
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>¥</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id={`amount-${index}`}
                  type="number"
                  min="1"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                  }}
                  aria-invalid={isInvalid}
                />
              </InputGroup>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
    </CardContent>
  </Card>
)
