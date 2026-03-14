import { Button } from '@frontend/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@frontend/components/ui/field'
import { Input } from '@frontend/components/ui/input'
import { Separator } from '@frontend/components/ui/separator'
import { CopyIcon } from 'lucide-react'

import type { FormInstance } from '../use-budget-new-form'
import {
  AVAILABLE_EXPENSE_CATEGORIES,
  AVAILABLE_INCOME_CATEGORIES,
  PREV_YEAR_ENTRIES,
} from '../use-budget-new-form'
import { BudgetEntriesSection } from './budget-entries-section'
import { BudgetSummary } from './budget-summary'

type Props = {
  form: FormInstance
  showYearField?: boolean
  showCopyButton?: boolean
}

export const BudgetNewFormFields: React.FC<Props> = ({
  form,
  showYearField = true,
  showCopyButton = true,
}) => (
  <>
    {(showYearField || showCopyButton) && (
      <div className="flex flex-wrap items-end gap-4">
        {showYearField && (
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
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
          </FieldGroup>
        )}

        {showCopyButton && (
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
        )}
      </div>
    )}

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
