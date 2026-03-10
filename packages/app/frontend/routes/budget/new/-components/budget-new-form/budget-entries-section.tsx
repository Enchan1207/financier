import { Button } from '@frontend/components/ui/button'
import { Field, FieldError } from '@frontend/components/ui/field'
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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@frontend/components/ui/table'
import { Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import type {
  AvailableCategory,
  BudgetEntry,
  FormInstance,
} from '../use-budget-new-form'

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
export const BudgetEntriesSection: React.FC<{
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
