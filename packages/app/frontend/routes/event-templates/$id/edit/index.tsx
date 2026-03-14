import { Button } from '@frontend/components/ui/button'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'

import { TEMPLATE_DETAILS } from '../../-components/template-data'
import { TemplateFormFields } from '../../-components/template-form-fields'
import { useTemplateForm } from '../../-components/use-template-form'

const EventTemplateEditPage: React.FC = () => {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const original = TEMPLATE_DETAILS[id]

  const form = useTemplateForm(
    {
      templateName: original?.name,
      items: original?.items.map((it) => ({
        categoryId: it.categoryId,
        name: it.name,
        amount: String(it.amount),
        type: it.type,
      })),
    },
    async () => {
      // モック：実際にはAPIを呼び出してテンプレートを更新する
      await new Promise((resolve) => setTimeout(resolve, 1000))
      void navigate({ to: '/event-templates/$id', params: { id } })
    },
  )

  if (!original) {
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
        <TemplateFormFields form={form} />

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
