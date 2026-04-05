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

import { TemplateFormFields } from '../-components/template-form-fields'
import { useTemplateForm } from '../-components/use-template-form'
import { createEventTemplate } from '../-repositories/event-templates'

const EventTemplateNewPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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
    mutationFn: createEventTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['event-templates'] })
      void navigate({ to: '/event-templates' })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const form = useTemplateForm({}, async (value) => {
    await mutation.mutateAsync({
      name: value.templateName,
      defaultTransactions: value.items.map((item) => ({
        categoryId: item.categoryId,
        name: item.name,
        amount: parseInt(item.amount, 10),
      })),
    })
  })

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/event-templates">
            <ArrowLeftIcon />
            テンプレート一覧へ
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">テンプレート新規作成</h1>
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
                テンプレートを保存
              </Button>
              <Button asChild variant="ghost">
                <Link to="/event-templates">キャンセル</Link>
              </Button>
            </div>
          )}
        />
      </form>
    </div>
  )
}

export const Route = createFileRoute('/event-templates/new/')({
  component: EventTemplateNewPage,
})
