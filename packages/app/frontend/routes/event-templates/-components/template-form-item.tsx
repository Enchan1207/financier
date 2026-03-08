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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select'
import { Trash2Icon } from 'lucide-react'

import type { useTemplateForm } from './use-template-form'

// 選択可能カテゴリ：isSaving=false のアクティブカテゴリのみ（UC-5.4）
export const SELECTABLE_CATEGORIES = [
  { id: 'cat-1', name: '食費' },
  { id: 'cat-2', name: '交通費' },
  { id: 'cat-3', name: '外食' },
  { id: 'cat-4', name: '娯楽・グッズ' },
  { id: 'cat-5', name: '衣服' },
  { id: 'cat-6', name: '日用品' },
  { id: 'cat-7', name: '美容' },
]

type Props = {
  form: ReturnType<typeof useTemplateForm>
  index: number
  canRemove: boolean
  onRemove: () => void
}

export const TemplateFormItem: React.FC<Props> = ({
  form,
  index,
  canRemove,
  onRemove,
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
        name={`items[${index}].type`}
        children={(field) => (
          <Field>
            <FieldLabel htmlFor={`type-${index}`}>種別</FieldLabel>
            <Select
              value={field.state.value}
              onValueChange={(v: 'income' | 'expense') => {
                field.handleChange(v)
              }}
            >
              <SelectTrigger id={`type-${index}`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">収入</SelectItem>
                <SelectItem value="expense">支出</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      <form.Field
        name={`items[${index}].categoryId`}
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={`cat-${index}`}>カテゴリ</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) => {
                  field.handleChange(v)
                }}
              >
                <SelectTrigger
                  id={`cat-${index}`}
                  className="w-full"
                  aria-invalid={isInvalid}
                >
                  <SelectValue placeholder="カテゴリを選択" />
                </SelectTrigger>
                <SelectContent>
                  {SELECTABLE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
