import { Button } from '@frontend/components/ui/button'
import { Calendar } from '@frontend/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { CalendarIcon, PencilIcon } from 'lucide-react'
import type React from 'react'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(1, 'イベント名を入力してください'),
  occurredOn: z.string().min(1, '発生日を入力してください'),
})

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultName: string
  defaultDate: string
  onSave: (name: string, date: string) => void
}

export const EventEditDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  defaultName,
  defaultDate,
  onSave,
}) => {
  const form = useForm({
    defaultValues: {
      name: defaultName,
      occurredOn: defaultDate,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: ({ value }) => {
      onSave(value.name.trim(), value.occurredOn)
      onOpenChange(false)
    },
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset({ name: defaultName, occurredOn: defaultDate })
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PencilIcon />
          編集
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>イベントを編集</DialogTitle>
        </DialogHeader>

        <form
          id="event-edit-form"
          onSubmit={async (e) => {
            e.preventDefault()
            await form.handleSubmit()
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
                    <FieldLabel htmlFor={field.name}>イベント名</FieldLabel>
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

            <form.Field
              name="occurredOn"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                const selectedDate = field.state.value
                  ? dayjs(field.state.value).toDate()
                  : undefined

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>発生日</FieldLabel>
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
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            field.handleChange(
                              date ? dayjs(date).format('YYYY-MM-DD') : '',
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
          </FieldGroup>
        </form>

        <DialogFooter>
          <form.Subscribe
            selector={(state) =>
              [state.values.name, state.values.occurredOn] as const
            }
            children={() => (
              <Button type="submit" form="event-edit-form">
                保存
              </Button>
            )}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
