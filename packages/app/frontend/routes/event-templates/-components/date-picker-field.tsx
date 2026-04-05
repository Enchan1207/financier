import { Button } from '@frontend/components/ui/button'
import { Calendar } from '@frontend/components/ui/calendar'
import { Field, FieldLabel } from '@frontend/components/ui/field'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@frontend/components/ui/popover'
import dayjs from '@frontend/lib/date'
import { CalendarIcon } from 'lucide-react'

type Props = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
}

export const DatePickerField: React.FC<Props> = ({
  id,
  label,
  value,
  onChange,
  onBlur,
}) => {
  const selectedDate = value ? dayjs(value).toDate() : undefined
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover
        onOpenChange={(open) => {
          if (!open) onBlur()
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
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
            onSelect={(d) => {
              onChange(d ? dayjs(d).format('YYYY-MM-DD') : '')
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}
