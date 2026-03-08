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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@frontend/components/ui/input-group'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@frontend/components/ui/popover'
import dayjs from '@frontend/lib/date'
import { formatCurrency } from '@frontend/lib/format'
import { useForm } from '@tanstack/react-form'
import { CalendarIcon, Loader2Icon } from 'lucide-react'
import type React from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
  amount: z
    .string()
    .min(1, '金額を入力してください')
    .refine((v) => parseInt(v, 10) > 0, '1以上の金額を入力してください'),
  date: z
    .string()
    .min(1, '日付を入力してください')
    .refine(
      (d) => d <= dayjs().format('YYYY-MM-DD'),
      '本日以前の日付を入力してください',
    ),
  name: z.string().min(1, '内容を入力してください'),
})

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryName: string
  balance: number
  onContribute: (amount: number, date: string, name: string) => Promise<void>
}

export const SavingContributionDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  categoryName,
  balance,
  onContribute,
}) => {
  const defaultName = `${dayjs().format('M')}月分積立`

  const form = useForm({
    defaultValues: {
      amount: '',
      date: dayjs().format('YYYY-MM-DD'),
      name: defaultName,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await onContribute(
          parseInt(value.amount, 10),
          value.date,
          value.name.trim(),
        )
        formApi.reset()
        onOpenChange(false)
      } catch {
        toast.error('拠出に失敗しました')
      }
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
          <DialogTitle>積立に拠出する</DialogTitle>
        </DialogHeader>

        <form.Subscribe
          selector={(state) =>
            [
              state.values.amount,
              state.values.date,
              state.values.name,
              state.isSubmitting,
            ] as const
          }
          children={([amount, date, name, isSubmitting]) => (
            <>
              <form
                id="saving-contribution-form"
                onSubmit={async (e) => {
                  e.preventDefault()
                  await form.handleSubmit()
                }}
              >
                <FieldGroup>
                  <p className="text-sm text-muted-foreground">
                    カテゴリ:&nbsp;
                    <span className="font-medium text-foreground">
                      {categoryName}
                    </span>
                  </p>

                  <form.Field
                    name="amount"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>金額</FieldLabel>
                          <InputGroup>
                            <InputGroupAddon>
                              <InputGroupText>¥</InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                              id={field.name}
                              name={field.name}
                              type="number"
                              min="1"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => {
                                field.handleChange(e.target.value)
                              }}
                              aria-invalid={isInvalid}
                              disabled={isSubmitting}
                            />
                          </InputGroup>
                          <p className="text-xs text-muted-foreground">
                            現在の積立残高: {formatCurrency(balance)}
                          </p>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )
                    }}
                  />

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
                                type="button"
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
                                disabled={{ after: dayjs().toDate() }}
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
                          <p className="text-xs text-muted-foreground">
                            当日または過去日を指定してください。
                          </p>
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
                </FieldGroup>
              </form>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    handleOpenChange(false)
                  }}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  form="saving-contribution-form"
                  disabled={!amount || !date || !name.trim() || isSubmitting}
                >
                  <Loader2Icon
                    className={`animate-spin ${isSubmitting ? '' : 'hidden'}`}
                  />
                  拠出する
                </Button>
              </DialogFooter>
            </>
          )}
        />
      </DialogContent>
    </Dialog>
  )
}
