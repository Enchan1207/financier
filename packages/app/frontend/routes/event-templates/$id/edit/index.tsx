import type {
  CategoryColor,
  CategoryIconType,
} from '@frontend/components/category/types'
import { Button } from '@frontend/components/ui/button'
import { listCategoriesQueryOptions } from '@frontend/routes/categories/-repositories/categories'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { TemplateFormFields } from '../../-components/template-form-fields'
import { useTemplateForm } from '../../-components/use-template-form'
import {
  getEventTemplateDetailQueryOptions,
  updateEventTemplate,
} from '../../-repositories/event-templates'

const EventTemplateEditPage: React.FC = () => {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: template, isPending: templatePending } = useQuery(
    getEventTemplateDetailQueryOptions(id),
  )
  const { data: categoriesData } = useQuery(listCategoriesQueryOptions())

  const categories = (categoriesData ?? [])
    .filter((c) => c.type !== 'saving')
    .map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon as CategoryIconType,
      color: c.color as CategoryColor,
    }))

  const mutation = useMutation({
    mutationFn: (body: Parameters<typeof updateEventTemplate>[1]) =>
      updateEventTemplate(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['event-templates'] })
      void navigate({ to: '/event-templates/$id', params: { id } })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const form = useTemplateForm(
    {
      templateName: template?.name,
      items: template?.items.map((it) => ({
        categoryId: it.categoryId,
        name: it.name,
        amount: String(it.defaultAmount),
      })),
    },
    async (value) => {
      await mutation.mutateAsync({
        name: value.templateName,
        defaultTransactions: value.items.map((item) => ({
          categoryId: item.categoryId,
          name: item.name,
          amount: parseInt(item.amount, 10),
        })),
      })
    },
  )

  if (templatePending) {
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
        <h1 className="text-2xl font-bold">テンプレートを編集</h1>
      </div>

      <form
        className="space-y-6 max-w-2xl lg:max-w-full"
        onSubmit={async (e) => {
          e.preventDefault()
          await form.handleSubmit()
        }}
      >
        <TemplateFormFields form={form} categories={categories} />

        <form.Subscribe
          selector={(state) => state.isSubmitting}
          children={(isSubmitting) => (
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                <Loader2Icon
                  className={`animate-spin ${isSubmitting ? '' : 'hidden'}`}
                />
                テンプレートを更新
              </Button>
              <Button asChild variant="ghost">
                <Link to="/event-templates/$id" params={{ id }}>
                  キャンセル
                </Link>
              </Button>
            </div>
          )}
        />
      </form>
    </div>
  )
}

export const Route = createFileRoute('/event-templates/$id/edit/')({
  component: EventTemplateEditPage,
})
