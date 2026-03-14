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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@frontend/components/ui/input-group'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@frontend/components/ui/toggle-group'
import { formatCurrency } from '@frontend/lib/format'
import { useForm } from '@tanstack/react-form'
import { Loader2Icon } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { z } from 'zod'

import type { BudgetItem } from './category-budget-card'

const MONTH_LABELS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
]

const budgetInputSchema = z.object({
  annualDirect: z.number().min(0, '0以上の数値を入力してください'),
  fixedMonthly: z.number().min(0, '0以上の数値を入力してください'),
  monthlyAmounts: z
    .array(z.number().min(0, '0以上の数値を入力してください'))
    .length(12),
})

type Props = {
  item: BudgetItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (item: BudgetItem) => Promise<void>
  checkBalance: (newAnnualBudget: number) => boolean
}

export const BudgetInputDialog: React.FC<Props> = ({
  item,
  open,
  onOpenChange,
  onSave,
  checkBalance,
}) => {
  const [activeTab, setActiveTab] = useState<'annual' | 'fixed' | 'variable'>(
    'annual',
  )
  const [balanceError, setBalanceError] = useState(false)

  const initialMonthly = Math.round(item.annualBudget / 12)

  const form = useForm({
    defaultValues: {
      annualDirect: item.annualBudget,
      fixedMonthly: initialMonthly,
      monthlyAmounts: Array<number>(12).fill(initialMonthly),
    },
    validators: { onChange: budgetInputSchema },
    onSubmit: async ({ value }) => {
      const annualBudget =
        activeTab === 'annual'
          ? value.annualDirect
          : activeTab === 'fixed'
            ? value.fixedMonthly * 12
            : value.monthlyAmounts.reduce((s, v) => s + v, 0)
      if (checkBalance(annualBudget)) {
        setBalanceError(true)
        return
      }
      setBalanceError(false)
      await onSave({ ...item, annualBudget })
    },
  })

  const handleOpenChange = (v: boolean) => {
    if (form.state.isSubmitting) return
    if (!v) form.reset()
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item.categoryName} の予算設定</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void form.handleSubmit()
          }}
        >
          <div className="space-y-4">
            <ToggleGroup
              type="single"
              variant="outline"
              value={activeTab}
              onValueChange={(v) => {
                if (v) {
                  setActiveTab(v as 'annual' | 'fixed' | 'variable')
                  setBalanceError(false)
                }
              }}
              className="w-full"
            >
              <ToggleGroupItem value="annual" className="flex-1">
                年額
              </ToggleGroupItem>
              <ToggleGroupItem value="fixed" className="flex-1">
                月額固定
              </ToggleGroupItem>
              <ToggleGroupItem value="variable" className="flex-1">
                月ごと変動
              </ToggleGroupItem>
            </ToggleGroup>

            {activeTab === 'annual' && (
              <FieldGroup>
                <form.Field
                  name="annualDirect"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>年額</FieldLabel>
                        <InputGroup>
                          <InputGroupAddon>
                            <InputGroupText>¥</InputGroupText>
                          </InputGroupAddon>
                          <InputGroupInput
                            id={field.name}
                            name={field.name}
                            type="number"
                            min={0}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => {
                              field.handleChange(Number(e.target.value))
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
              </FieldGroup>
            )}

            {activeTab === 'fixed' && (
              <>
                <FieldGroup>
                  <form.Field
                    name="fixedMonthly"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>月額</FieldLabel>
                          <InputGroup>
                            <InputGroupAddon>
                              <InputGroupText>¥</InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                              id={field.name}
                              name={field.name}
                              type="number"
                              min={0}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => {
                                field.handleChange(Number(e.target.value))
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
                </FieldGroup>
                <form.Subscribe
                  selector={(state) => state.values.fixedMonthly}
                  children={(fixedMonthly) => (
                    <p className="text-sm text-muted-foreground text-right">
                      年額: {formatCurrency(fixedMonthly * 12)}
                    </p>
                  )}
                />
              </>
            )}

            {activeTab === 'variable' && (
              <>
                <div className="max-h-64 overflow-y-auto">
                  <FieldGroup>
                    {MONTH_LABELS.map((label, index) => (
                      <form.Field
                        key={index}
                        name={`monthlyAmounts[${index}]`}
                        children={(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid
                          return (
                            <Field
                              data-invalid={isInvalid}
                              className="flex items-center gap-3"
                            >
                              <FieldLabel
                                htmlFor={field.name}
                                className="w-10 shrink-0 text-right"
                              >
                                {label}
                              </FieldLabel>
                              <div className="flex-1">
                                <InputGroup>
                                  <InputGroupAddon>
                                    <InputGroupText>¥</InputGroupText>
                                  </InputGroupAddon>
                                  <InputGroupInput
                                    id={field.name}
                                    name={field.name}
                                    type="number"
                                    min={0}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                      field.handleChange(Number(e.target.value))
                                    }}
                                    aria-invalid={isInvalid}
                                  />
                                </InputGroup>
                                {isInvalid && (
                                  <FieldError
                                    errors={field.state.meta.errors}
                                  />
                                )}
                              </div>
                            </Field>
                          )
                        }}
                      />
                    ))}
                  </FieldGroup>
                </div>
                <form.Subscribe
                  selector={(state) => state.values.monthlyAmounts}
                  children={(amounts) => (
                    <p className="text-sm text-muted-foreground text-right">
                      年額合計:{' '}
                      {formatCurrency(amounts.reduce((s, v) => s + v, 0))}
                    </p>
                  )}
                />
              </>
            )}
          </div>

          <form.Subscribe
            selector={(state) => state.isSubmitting}
            children={(isSubmitting) => (
              <DialogFooter className="mt-6">
                {balanceError && (
                  <p className="w-full text-sm text-destructive">
                    支出予算合計が収入予算合計を超えるため保存できません。
                  </p>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  <Loader2Icon
                    className={`animate-spin ${isSubmitting ? '' : 'hidden'}`}
                  />
                  保存
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSubmitting}
                  onClick={() => {
                    handleOpenChange(false)
                  }}
                >
                  キャンセル
                </Button>
              </DialogFooter>
            )}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
