import { Button } from '@frontend/components/ui/button'
import { Field, FieldError, FieldLabel } from '@frontend/components/ui/field'
import { Input } from '@frontend/components/ui/input'
import { Separator } from '@frontend/components/ui/separator'
import { PlusIcon } from 'lucide-react'

import { TemplateFormItem } from './template-form-item'
import type { useTemplateForm } from './use-template-form'
import { newFormItemValues } from './use-template-form'

type Props = {
  form: ReturnType<typeof useTemplateForm>
}

export const TemplateFormFields: React.FC<Props> = ({ form }) => (
  <>
    <form.Field
      name="templateName"
      children={(field) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>テンプレート名</FieldLabel>
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

    <Separator />

    <div className="space-y-3">
      <h2 className="text-sm font-medium">取引定義</h2>
      <form.Field
        name="items"
        mode="array"
        children={(field) => (
          <>
            {field.state.value.map((_, index) => (
              <TemplateFormItem
                key={index}
                form={form}
                index={index}
                canRemove={field.state.value.length > 1}
                onRemove={() => {
                  field.removeValue(index)
                }}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              size="sm"
              onClick={() => {
                field.pushValue(newFormItemValues())
              }}
            >
              <PlusIcon />
              追加
            </Button>
          </>
        )}
      />
    </div>
  </>
)
