import type { CategorySelectItem } from '@frontend/components/category/category-select'
import { CategorySelect } from '@frontend/components/category/category-select'
import { Button } from '@frontend/components/ui/button'
import { Calendar } from '@frontend/components/ui/calendar'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@frontend/components/ui/popover'
import dayjs from '@frontend/lib/date'
import { useForm } from '@tanstack/react-form'
import { CalendarIcon } from 'lucide-react'
import type React from 'react'
import { z } from 'zod'

const formSchema = z.object({
  date: z.string().min(1, '日付を入力してください'),
  name: z.string().min(1, '内容を入力してください'),
  categoryId: z.string().min(1, 'カテゴリを入力してください'),
  amount: z.string().min(1, '金額を入力してください'),
})

export type NewTransaction = {
  date: string
  name: string
  categoryId: string
  type: 'income' | 'expense'
  amount: number
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: CategorySelectItem[]
  categoryTypes: Record<string, 'income' | 'expense' | 'saving'>
  onAdd: (tx: NewTransaction) => Promise<void>
}

export const EventAddTransactionDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  categories,
  categoryTypes,
  onAdd,
}) => {
  const form = useForm({
    defaultValues: {
      date: dayjs().format('YYYY-MM-DD'),
      name: '',
      categoryId: '',
      amount: '',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const catType = categoryTypes[value.categoryId] ?? 'expense'
      const type: 'income' | 'expense' =
        catType === 'income' ? 'income' : 'expense'
      await onAdd({
        date: value.date,
        name: value.name.trim(),
        categoryId: value.categoryId,
        type,
        amount: Number(value.amount),
      })
      formApi.reset()
      onOpenChange(false)
    },
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) form.reset()
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>イベントにトランザクションを追加</DialogTitle>
        </DialogHeader>

        <form.Subscribe
          selector={(state) =>
            [
              state.values.date,
              state.values.name,
              state.values.categoryId,
              state.values.amount,
              state.isSubmitting,
            ] as const
          }
          children={([date, name, categoryId, amount, isSubmitting]) => (
            <>
              <form
                id="event-add-transaction-form"
                onSubmit={async (e) => {
                  e.preventDefault()
                  await form.handleSubmit()
                }}
              >
                <FieldGroup>
                  <form.Field
                    name="date"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid
                      const selectedDate = field.state.value
                        ? dayjs(field.state.value).toDate()
                        : undefined

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>日付</FieldLabel>
                          <Popover
                            onOpenChange={(popoverOpen) => {
                              if (!popoverOpen) field.handleBlur()
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                id={field.name}
                                variant="outline"
                                aria-invalid={isInvalid}
                                disabled={isSubmitting}
                                className={
                                  selectedDate
                                    ? 'w-full justify-start text-left font-normal'
                                    : 'w-full justify-start text-left font-normal text-muted-foreground'
                                }
                              >
                                <CalendarIcon />
                                {selectedDate
                                  ? dayjs(selectedDate).format('YYYY/MM/DD')
                                  : '日付を選択'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                  field.handleChange(
                                    date
                                      ? dayjs(date).format('YYYY-MM-DD')
                                      : '',
                                  )
                                }}
                              />
                            </PopoverContent>
                          </Popover>

                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )
                    }}
                  />

                  <form.Field
                    name="name"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>内容</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => {
                              field.handleChange(e.target.value)
                            }}
                            aria-invalid={isInvalid}
                            disabled={isSubmitting}
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )
                    }}
                  />

                  <form.Field
                    name="categoryId"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>カテゴリ</FieldLabel>
                          <CategorySelect
                            id={field.name}
                            aria-invalid={isInvalid}
                            categories={categories}
                            value={field.state.value}
                            onValueChange={(value) => {
                              field.handleChange(value)
                            }}
                            onOpenChange={(catOpen) => {
                              if (!catOpen) field.handleBlur()
                            }}
                            disabled={isSubmitting}
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )
                    }}
                  />

                  <form.Field
                    name="amount"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>金額</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="number"
                            min={0}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => {
                              field.handleChange(e.target.value)
                            }}
                            aria-invalid={isInvalid}
                            disabled={isSubmitting}
                            required
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )
                    }}
                  />
                </FieldGroup>
              </form>

              <DialogFooter>
                <Button
                  type="submit"
                  form="event-add-transaction-form"
                  disabled={
                    !date ||
                    !name.trim() ||
                    !categoryId ||
                    !amount ||
                    isSubmitting
                  }
                >
                  追加
                </Button>
              </DialogFooter>
            </>
          )}
        />
      </DialogContent>
    </Dialog>
  )
}
