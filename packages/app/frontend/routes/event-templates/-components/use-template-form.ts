import { useForm } from '@tanstack/react-form'
import { z } from 'zod'

const itemSchema = z.object({
  categoryId: z.string().min(1, 'カテゴリを選択してください'),
  name: z.string().min(1, '内容名を入力してください'),
  amount: z
    .string()
    .refine((v) => parseInt(v, 10) > 0, '1以上の金額を入力してください'),
})

export const templateFormSchema = z.object({
  templateName: z.string().min(1, 'テンプレート名を入力してください'),
  items: z.array(itemSchema).min(1, '取引を1件以上追加してください'),
})

export type FormItemValues = {
  categoryId: string
  name: string
  amount: string
}

export const newFormItemValues = (): FormItemValues => ({
  categoryId: '',
  name: '',
  amount: '',
})

export const useTemplateForm = (
  initialValues: { templateName?: string; items?: FormItemValues[] } = {},
  onSubmit: (value: {
    templateName: string
    items: FormItemValues[]
  }) => void | Promise<void> = () => {},
) => {
  return useForm({
    defaultValues: {
      templateName: initialValues.templateName ?? '',
      items: initialValues.items ?? [newFormItemValues()],
    },
    validators: {
      onSubmit: templateFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })
}
