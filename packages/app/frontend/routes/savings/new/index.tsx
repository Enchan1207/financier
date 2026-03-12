import { Button } from '@frontend/components/ui/button'
import { Calendar } from '@frontend/components/ui/calendar'
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
import { Separator } from '@frontend/components/ui/separator'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@frontend/components/ui/toggle-group'
import dayjs from '@frontend/lib/date'
import { useForm } from '@tanstack/react-form'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, CalendarIcon, Loader2Icon, XIcon } from 'lucide-react'
import { z } from 'zod'

type SavingType = 'goal' | 'free'

const formSchema = z
  .object({
    categoryName: z.string().min(1, 'カテゴリ名を入力してください'),
    savingType: z.enum(['goal', 'free']),
    targetAmount: z.string(),
    deadline: z.string(),
  })
  .superRefine((val, ctx) => {
    if (val.savingType === 'goal' && !(parseInt(val.targetAmount, 10) > 0)) {
      ctx.addIssue({
        code: 'custom',
        message: '1以上の目標金額を入力してください',
        path: ['targetAmount'],
      })
    }
  })

const SavingNewPage: React.FC = () => {
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: {
      categoryName: '',
      savingType: 'goal' as SavingType,
      targetAmount: '',
      deadline: '',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async () => {
      // モック：実際にはAPIを呼び出してカテゴリと積立定義を同時に作成する
      await new Promise((resolve) => setTimeout(resolve, 800))
      void navigate({ to: '/savings' })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/savings">
            <ArrowLeftIcon />
            積立一覧へ
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">積立新規作成</h1>
      </div>

      <form
        className="space-y-6 max-w-2xl lg:max-w-full"
        onSubmit={async (e) => {
          e.preventDefault()
          await form.handleSubmit()
        }}
      >
        <FieldGroup>
          <form.Field
            name="categoryName"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>カテゴリ名 *</FieldLabel>
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
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        </FieldGroup>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-sm font-medium">積立設定</h2>

          <FieldGroup>
            <form.Field
              name="savingType"
              children={(field) => (
                <Field>
                  <FieldLabel>積立の型 *</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={field.state.value}
                    className="w-full md:w-fit"
                    onValueChange={(val) => {
                      if (val) {
                        field.handleChange(val as SavingType)
                        form.setFieldValue('targetAmount', '')
                        form.setFieldValue('deadline', '')
                      }
                    }}
                  >
                    <ToggleGroupItem
                      value="goal"
                      className="flex-1 md:min-w-[100px]"
                    >
                      目標型
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="free"
                      className="flex-1 md:min-w-[100px]"
                    >
                      自由型
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <p className="text-xs text-muted-foreground">
                    {field.state.value === 'goal'
                      ? '目標金額と期限（任意）を設定します。'
                      : '目標金額なし。累積額のみを管理します。'}
                  </p>
                </Field>
              )}
            />

            <form.Subscribe
              selector={(state) => state.values.savingType}
              children={(savingType) =>
                savingType === 'goal' ? (
                  <>
                    <form.Field
                      name="targetAmount"
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>
                              目標金額 *
                            </FieldLabel>
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
                              />
                            </InputGroup>
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
                  </>
                ) : null
              }
            />
          </FieldGroup>
        </div>

        <form.Subscribe
          selector={(state) =>
            [
              state.values.categoryName,
              state.values.savingType,
              state.values.targetAmount,
              state.isSubmitting,
            ] as const
          }
          children={([
            categoryName,
            savingType,
            targetAmount,
            isSubmitting,
          ]) => (
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={
                  !categoryName.trim() ||
                  (savingType === 'goal' &&
                    !(parseInt(targetAmount, 10) > 0)) ||
                  isSubmitting
                }
              >
                <Loader2Icon
                  className={`animate-spin ${isSubmitting ? '' : 'hidden'}`}
                />
                積立を作成
              </Button>
              <Button asChild variant="ghost">
                <Link to="/savings">キャンセル</Link>
              </Button>
            </div>
          )}
        />
      </form>
    </div>
  )
}

export const Route = createFileRoute('/savings/new/')({
  component: SavingNewPage,
})
