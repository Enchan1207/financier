import { CategorySelect } from '@frontend/components/category/category-select'
import type {
  CategoryColor,
  CategoryIconType,
} from '@frontend/components/category/types'
import { Input } from '@frontend/components/ui/input'
import { Label } from '@frontend/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@frontend/components/ui/toggle-group'
import type { TransactionType } from '@frontend/lib/types'
import { useForm } from '@tanstack/react-form'
import type React from 'react'
import { z } from 'zod'

export type FormCategory = {
  id: string
  name: string
  type: 'income' | 'expense' | 'saving'
  icon: CategoryIconType
  color: CategoryColor
}

export type FormEvent = {
  id: string
  name: string
}

export const transactionFormSchema = z.object({
  type: z.enum(['income', 'expense'] as const),
  categoryId: z.string().min(1),
  amount: z.string().refine((v) => v !== '' && Number(v) > 0),
  name: z.string().min(1),
  transactionDate: z.string().min(1),
  eventId: z.string(),
})

export type TransactionFormValues = z.infer<typeof transactionFormSchema>

export const useTransactionForm = (
  defaultValues: TransactionFormValues,
  onSubmit: (values: TransactionFormValues) => Promise<void>,
) =>
  useForm({
    defaultValues,
    validators: { onChange: transactionFormSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

type TransactionFormInstance = ReturnType<typeof useTransactionForm>

type TransactionFormFieldsProps = {
  form: TransactionFormInstance
  categories: FormCategory[]
  events: FormEvent[]
}

export const TransactionFormFields: React.FC<TransactionFormFieldsProps> = ({
  form,
  categories,
  events,
}) => (
  <div className="space-y-4 pt-2">
    {/* 収支種別 */}
    <form.Field
      name="type"
      children={(field) => (
        <div className="space-y-1.5">
          <Label>種別</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={field.state.value}
            onValueChange={(v) => {
              if (!v) return
              field.handleChange(v as TransactionType)
              form.setFieldValue('categoryId', '')
            }}
            className="w-full"
          >
            <ToggleGroupItem value="expense" className="flex-1">
              支出
            </ToggleGroupItem>
            <ToggleGroupItem value="income" className="flex-1">
              収入
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
    />

    {/* カテゴリ（種別連動） */}
    <form.Subscribe
      selector={(state) => state.values.type}
      children={(type) => (
        <form.Field
          name="categoryId"
          children={(field) => {
            const filteredCategories = categories.filter((c) =>
              type === 'income'
                ? c.type === 'income'
                : c.type === 'expense' || c.type === 'saving',
            )
            return (
              <div className="space-y-1.5">
                <Label htmlFor="tx-category">カテゴリ</Label>
                <CategorySelect
                  id="tx-category"
                  className="w-full"
                  categories={filteredCategories}
                  value={field.state.value}
                  onValueChange={field.handleChange}
                />
              </div>
            )
          }}
        />
      )}
    />

    {/* 金額 */}
    <form.Field
      name="amount"
      children={(field) => (
        <div className="space-y-1.5">
          <Label htmlFor="tx-amount">金額</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              ¥
            </span>
            <Input
              id="tx-amount"
              type="number"
              value={field.state.value}
              onChange={(e) => {
                field.handleChange(e.target.value)
              }}
              onBlur={field.handleBlur}
              className="pl-7"
            />
          </div>
        </div>
      )}
    />

    {/* 内容 */}
    <form.Field
      name="name"
      children={(field) => (
        <div className="space-y-1.5">
          <Label htmlFor="tx-name">内容</Label>
          <Input
            id="tx-name"
            value={field.state.value}
            onChange={(e) => {
              field.handleChange(e.target.value)
            }}
            onBlur={field.handleBlur}
          />
        </div>
      )}
    />

    {/* 日付 */}
    <form.Field
      name="transactionDate"
      children={(field) => (
        <div className="space-y-1.5">
          <Label htmlFor="tx-date">日付</Label>
          <Input
            id="tx-date"
            type="date"
            value={field.state.value}
            onChange={(e) => {
              field.handleChange(e.target.value)
            }}
            onBlur={field.handleBlur}
          />
        </div>
      )}
    />

    {/* イベント（任意） */}
    <form.Field
      name="eventId"
      children={(field) => (
        <div className="space-y-1.5">
          <Label htmlFor="tx-event">イベント</Label>
          <Select
            value={field.state.value || '_none'}
            onValueChange={(v) => {
              field.handleChange(v === '_none' ? '' : v)
            }}
          >
            <SelectTrigger id="tx-event" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">なし</SelectItem>
              {events.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>
                  {ev.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    />
  </div>
)
