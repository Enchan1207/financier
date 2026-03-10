import { Button } from '@frontend/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select'
import { Separator } from '@frontend/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@frontend/components/ui/table'
import { CopyIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import type { SummaryBarItem } from '../../-components/budget-summary-chart'
import { BudgetSummaryBar } from '../../-components/budget-summary-chart'
import type {
  AvailableCategory,
  BudgetEntry,
  useBudgetNewForm,
} from './use-budget-new-form'
import {
  AVAILABLE_EXPENSE_CATEGORIES,
  AVAILABLE_INCOME_CATEGORIES,
  PREV_YEAR_ENTRIES,
} from './use-budget-new-form'

type FormInstance = ReturnType<typeof useBudgetNewForm>

// カテゴリ追加セレクト（ローカル state を持つため独立コンポーネント化）
const AddCategorySelect: React.FC<{
  availableCategories: AvailableCategory[]
  onAdd: (entry: BudgetEntry) => void
}> = ({ availableCategories, onAdd }) => {
  const [value, setValue] = useState('')

  if (availableCategories.length === 0) return null

  return (
    <Select
      value={value}
      onValueChange={(categoryId) => {
        const cat = availableCategories.find((c) => c.id === categoryId)
        if (!cat) return
        onAdd({ categoryId: cat.id, categoryName: cat.name, annualBudget: '' })
        setValue('')
      }}
    >
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue placeholder="カテゴリを追加…" />
      </SelectTrigger>
      <SelectContent>
        {availableCategories.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// 収入 or 支出の予算入力セクション
const BudgetEntriesSection: React.FC<{
  form: FormInstance
  fieldName: 'incomeEntries' | 'expenseEntries'
  allCategories: AvailableCategory[]
  label: string
}> = ({ form, fieldName, allCategories, label }) => (
  <div className="space-y-3">
    <h2 className="text-base font-semibold">{label}</h2>

    <form.Field
      name={fieldName}
      mode="array"
      children={(arrayField) => {
        const entries = arrayField.state.value
        const addedIds = new Set(entries.map((e) => e.categoryId))
        const selectableCategories = allCategories.filter(
          (c) => !addedIds.has(c.id),
        )
        const total = entries.reduce(
          (sum, e) => sum + (parseInt(e.annualBudget, 10) || 0),
          0,
        )

        return (
          <>
            {entries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>カテゴリ</TableHead>
                    <TableHead className="w-48">年額予算</TableHead>
                    <TableHead className="w-32 text-right">月額目安</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((item, index) => (
                    <form.Field
                      key={item.categoryId}
                      name={`${fieldName}[${index}].annualBudget`}
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid
                        const monthly =
                          parseInt(field.state.value, 10) > 0
                            ? `¥${Math.round(parseInt(field.state.value, 10) / 12).toLocaleString('ja-JP')}`
                            : '—'
                        return (
                          <TableRow>
                            <TableCell>{item.categoryName}</TableCell>
                            <TableCell>
                              <Field data-invalid={isInvalid}>
                                <InputGroup>
                                  <InputGroupAddon>
                                    <InputGroupText>¥</InputGroupText>
                                  </InputGroupAddon>
                                  <InputGroupInput
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                      field.handleChange(e.target.value)
                                    }}
                                    aria-invalid={isInvalid}
                                  />
                                </InputGroup>
                                {isInvalid && (
                                  <FieldError
                                    errors={field.state.meta.errors}
                                  />
                                )}
                              </Field>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground tabular-nums">
                              {monthly}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  arrayField.removeValue(index)
                                }}
                                aria-label={`${item.categoryName}を削除`}
                              >
                                <Trash2Icon />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      }}
                    />
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-medium">合計</TableCell>
                    <TableCell
                      colSpan={3}
                      className="text-right font-medium tabular-nums"
                    >
                      ¥{total.toLocaleString('ja-JP')}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                カテゴリが追加されていません
              </p>
            )}

            <AddCategorySelect
              availableCategories={selectableCategories}
              onAdd={(entry) => {
                arrayField.pushValue(entry)
              }}
            />
          </>
        )
      }}
    />
  </div>
)

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]
const PADDING_COLOR = 'var(--border)'

// 収支サマリ
const BudgetSummary: React.FC<{ form: FormInstance }> = ({ form }) => (
  <form.Subscribe
    selector={(state) => ({
      incomeEntries: state.values.incomeEntries,
      expenseEntries: state.values.expenseEntries,
    })}
    children={({ incomeEntries, expenseEntries }) => {
      const toBarItems = (entries: typeof incomeEntries): SummaryBarItem[] =>
        entries
          .filter((e) => parseInt(e.annualBudget, 10) > 0)
          .map((e, i) => ({
            categoryId: e.categoryId,
            categoryName: e.categoryName,
            amount: parseInt(e.annualBudget, 10),
            color: CHART_COLORS[i % CHART_COLORS.length] ?? 'var(--chart-1)',
          }))

      const baseIncomeItems = toBarItems(incomeEntries)
      const baseExpenseItems = toBarItems(expenseEntries)
      const incomeTotal = baseIncomeItems.reduce((sum, e) => sum + e.amount, 0)
      const expenseTotal = baseExpenseItems.reduce(
        (sum, e) => sum + e.amount,
        0,
      )
      const balance = incomeTotal - expenseTotal
      const isDeficit = balance < 0

      // 収支が一致するようパディングを追加して両バーの軸を揃える
      const incomeItems: SummaryBarItem[] = isDeficit
        ? [
            ...baseIncomeItems,
            {
              categoryId: 'shortfall',
              categoryName: '不足分',
              amount: -balance,
              color: PADDING_COLOR,
              labelColor: 'var(--muted-foreground)',
            },
          ]
        : baseIncomeItems
      const expenseItems: SummaryBarItem[] =
        !isDeficit && balance > 0
          ? [
              ...baseExpenseItems,
              {
                categoryId: 'unallocated',
                categoryName: '未割り当て',
                amount: balance,
                color: PADDING_COLOR,
                labelColor: 'var(--muted-foreground)',
              },
            ]
          : baseExpenseItems

      const hasData = baseIncomeItems.length > 0 || baseExpenseItems.length > 0

      return (
        <div className="rounded-lg border p-4 space-y-4">
          <h2 className="text-sm font-semibold">収支サマリ</h2>

          {hasData && (
            <div className="space-y-3">
              <BudgetSummaryBar sectionLabel="収入" items={incomeItems} />
              <BudgetSummaryBar sectionLabel="支出" items={expenseItems} />
            </div>
          )}

          <div className="space-y-1 text-sm">
            <Separator />
            <div className="flex justify-between font-medium">
              <span>収支差分</span>
              <span
                className={`tabular-nums ${isDeficit ? 'text-destructive' : ''}`}
              >
                {isDeficit ? '−' : '+'}¥
                {Math.abs(balance).toLocaleString('ja-JP')}
              </span>
            </div>
          </div>

          {isDeficit && (
            <p className="text-xs text-destructive">
              支出合計が収入合計を超えています。予算配分を見直してください。
            </p>
          )}
        </div>
      )
    }}
  />
)

type Props = {
  form: FormInstance
}

export const BudgetNewFormFields: React.FC<Props> = ({ form }) => (
  <>
    <div className="flex flex-wrap items-end gap-4">
      <FieldGroup className="flex-none">
        <form.Field
          name="year"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid} className="w-36">
                <FieldLabel htmlFor={field.name}>年度 *</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  min="2000"
                  max="2100"
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

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          form.setFieldValue('incomeEntries', PREV_YEAR_ENTRIES.income)
          form.setFieldValue('expenseEntries', PREV_YEAR_ENTRIES.expense)
        }}
      >
        <CopyIcon />
        前年度からコピー
      </Button>
    </div>

    <Separator />

    <BudgetEntriesSection
      form={form}
      fieldName="incomeEntries"
      allCategories={AVAILABLE_INCOME_CATEGORIES}
      label="収入予算"
    />

    <Separator />

    <BudgetEntriesSection
      form={form}
      fieldName="expenseEntries"
      allCategories={AVAILABLE_EXPENSE_CATEGORIES}
      label="支出予算"
    />

    <Separator />

    <BudgetSummary form={form} />
  </>
)
