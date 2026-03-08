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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@frontend/components/ui/input-group'
import { formatCurrency } from '@frontend/lib/format'
import { useForm } from '@tanstack/react-form'
import type React from 'react'
import { z } from 'zod'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 現在の積立残高（上限として使用） */
  balance: number
  onWithdraw: (amount: number, memo: string) => void
}

export const SavingWithdrawalDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  balance,
  onWithdraw,
}) => {
  const formSchema = z.object({
    amount: z
      .string()
      .min(1, '取り崩し額を入力してください')
      .refine((v) => parseInt(v, 10) > 0, '1以上の金額を入力してください')
      .refine(
        (v) => parseInt(v, 10) <= balance,
        `上限（${formatCurrency(balance)}）以下の金額を入力してください`,
      ),
    memo: z.string(),
  })

  const form = useForm({
    defaultValues: {
      amount: '',
      memo: '',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: ({ value, formApi }) => {
      onWithdraw(parseInt(value.amount, 10), value.memo)
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
          <DialogTitle>積立を取り崩す</DialogTitle>
        </DialogHeader>

        <form.Subscribe
          selector={(state) =>
            [state.values.amount, state.isSubmitting] as const
          }
          children={([amount, isSubmitting]) => (
            <>
              <form
                id="saving-withdrawal-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  void form.handleSubmit()
                }}
              >
                <FieldGroup>
                  <form.Field
                    name="amount"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid

                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            取り崩し額
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
                              max={balance}
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
                            上限: {formatCurrency(balance)}
                          </p>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )
                    }}
                  />

                  <form.Field
                    name="memo"
                    children={(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          メモ（任意）
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => {
                            field.handleChange(e.target.value)
                          }}
                          disabled={isSubmitting}
                        />
                      </Field>
                    )}
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
                  form="saving-withdrawal-form"
                  disabled={!amount || isSubmitting}
                >
                  取り崩す
                </Button>
              </DialogFooter>
            </>
          )}
        />
      </DialogContent>
    </Dialog>
  )
}
