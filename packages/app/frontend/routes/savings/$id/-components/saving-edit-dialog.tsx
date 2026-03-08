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
import type { SavingDefinition } from '@frontend/lib/types'
import { useForm } from '@tanstack/react-form'
import { CalendarIcon, XIcon } from 'lucide-react'
import type React from 'react'
import { z } from 'zod'

const formSchema = z.object({
  targetAmount: z
    .string()
    .min(1, '目標金額を入力してください')
    .refine((v) => parseInt(v, 10) > 0, '1以上の金額を入力してください'),
  deadline: z.string(),
})

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  saving: SavingDefinition
  onSave: (targetAmount: number, deadline: string) => void
}

export const SavingEditDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  saving,
  onSave,
}) => {
  const form = useForm({
    defaultValues: {
      targetAmount: saving.targetAmount?.toString() ?? '',
      deadline: saving.deadline ?? '',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: ({ value, formApi }) => {
      onSave(parseInt(value.targetAmount, 10), value.deadline)
      formApi.reset()
      onOpenChange(false)
    },
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset({
        targetAmount: saving.targetAmount?.toString() ?? '',
        deadline: saving.deadline ?? '',
      })
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>積立設定を編集</DialogTitle>
        </DialogHeader>

        <form.Subscribe
          selector={(state) => state.values.targetAmount}
          children={(targetAmount) => (
            <>
              <form
                id="saving-edit-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  void form.handleSubmit()
                }}
              >
                <FieldGroup>
                  <form.Field
                    name="targetAmount"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>目標金額</FieldLabel>
                          <Input
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
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )
                    }}
                  />

                  <form.Field
                    name="deadline"
                    children={(field) => {
                      const selectedDate = field.state.value
                        ? dayjs(field.state.value).toDate()
                        : undefined

                      return (
                        <Field>
                          <FieldLabel htmlFor={field.name}>
                            期限（任意）
                          </FieldLabel>
                          <Field orientation="horizontal">
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
                                  className={
                                    selectedDate
                                      ? 'flex-1 justify-start text-left font-normal'
                                      : 'flex-1 justify-start text-left font-normal text-muted-foreground'
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
                            {field.state.value && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  field.handleChange('')
                                }}
                                aria-label="期限をクリア"
                              >
                                <XIcon />
                              </Button>
                            )}
                          </Field>
                          <p className="text-xs text-muted-foreground">
                            期限を設定すると月次目安額が算出されます。
                          </p>
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
                    onOpenChange(false)
                  }}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  form="saving-edit-form"
                  disabled={!targetAmount}
                >
                  保存
                </Button>
              </DialogFooter>
            </>
          )}
        />
      </DialogContent>
    </Dialog>
  )
}
