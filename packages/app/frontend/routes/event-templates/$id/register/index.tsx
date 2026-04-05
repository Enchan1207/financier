import { Button } from '@frontend/components/ui/button'
import dayjs from '@frontend/lib/date'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { DatePickerField } from '../../-components/date-picker-field'
import type { RegisterItem } from '../../-components/register-items-table'
import { RegisterItemsTable } from '../../-components/register-items-table'
import {
  getEventTemplateDetailQueryOptions,
  registerEventTemplate,
} from '../../-repositories/event-templates'

const formatCurrency = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`

const formSchema = z.object({
  date: z.string().min(1, '取引日を入力してください'),
  items: z.array(
    z.object({ categoryId: z.string(), name: z.string(), amount: z.string() }),
  ),
})

const EventTemplateRegisterPage: React.FC = () => {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: template, isPending } = useQuery(
    getEventTemplateDetailQueryOptions(id),
  )

  const mutation = useMutation({
    mutationFn: (body: Parameters<typeof registerEventTemplate>[1]) =>
      registerEventTemplate(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['events'] })
      void navigate({ to: '/event-templates/$id', params: { id } })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const form = useForm({
    defaultValues: {
      date: dayjs().format('YYYY-MM-DD'),
      items: template
        ? template.items.map((item) => ({
            categoryId: item.categoryId,
            name: item.name,
            amount: String(item.defaultAmount),
          }))
        : [],
    },
    validators: { onSubmit: formSchema },
    onSubmit: ({ value }) =>
      mutation.mutateAsync({
        occurredOn: value.date,
        items: value.items.map((item) => ({
          categoryId: item.categoryId,
          name: item.name,
          amount: parseInt(item.amount, 10),
        })),
      }),
  })

  if (isPending) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        読み込み中...
      </p>
    )
  }

  if (!template) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/event-templates">
            <ArrowLeftIcon />
            テンプレート一覧へ
          </Link>
        </Button>
        <p className="text-muted-foreground">テンプレートが見つかりません。</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/event-templates/$id" params={{ id }}>
            <ArrowLeftIcon />
            テンプレート詳細へ
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">一括登録：{template.name}</h1>
      </div>

      <form
        className="max-w-2xl lg:max-w-full space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          await form.handleSubmit()
        }}
      >
        <form.Field
          name="date"
          children={(field) => (
            <DatePickerField
              id="bulk-date"
              label="取引日（全件共通）"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
            />
          )}
        />

        <form.Subscribe
          selector={(state) => state.values.items}
          children={(formItems) => {
            const tableItems: RegisterItem[] = template.items.map(
              (item, index) => ({
                categoryName: item.categoryName,
                name: item.name,
                type: item.type,
                amount: formItems[index]?.amount ?? String(item.defaultAmount),
              }),
            )
            return (
              <RegisterItemsTable
                items={tableItems}
                onAmountChange={(index, value) => {
                  form.setFieldValue(`items[${index}].amount`, value)
                }}
                onAmountBlur={(index) => {
                  void form.validateField(`items[${index}].amount`, 'blur')
                }}
              />
            )
          }}
        />

        <form.Subscribe
          selector={(state) =>
            [state.values.date, state.values.items, state.isSubmitting] as const
          }
          children={([date, items, isSubmitting]) => {
            const total = template.items.reduce((sum, item, index) => {
              const v = parseInt(items[index]?.amount ?? '0', 10)
              const signed = isNaN(v) ? 0 : item.type === 'income' ? v : -v
              return sum + signed
            }, 0)
            return (
              <>
                <p className="text-right text-sm font-bold">
                  収支合計：{total >= 0 ? '+' : ''}
                  {formatCurrency(total)}
                </p>
                <div className="flex gap-2">
                  <Button type="submit" disabled={!date || isSubmitting}>
                    <Loader2Icon
                      className={`animate-spin ${isSubmitting ? '' : 'hidden'}`}
                    />
                    一括保存
                  </Button>
                  <Button asChild variant="ghost">
                    <Link to="/event-templates/$id" params={{ id }}>
                      キャンセル
                    </Link>
                  </Button>
                </div>
              </>
            )
          }}
        />
      </form>
    </div>
  )
}

export const Route = createFileRoute('/event-templates/$id/register/')({
  component: EventTemplateRegisterPage,
})
