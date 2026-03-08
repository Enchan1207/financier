import { Button } from '@frontend/components/ui/button'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'

import { TemplateFormFields } from '../-components/template-form-fields'
import { useTemplateForm } from '../-components/use-template-form'

const EventTemplateNewPage: React.FC = () => {
  const navigate = useNavigate()
  const form = useTemplateForm({}, async () => {
    // モック：実際にはAPIを呼び出してテンプレートを作成する
    await new Promise((resolve) => setTimeout(resolve, 1000))
    void navigate({ to: '/event-templates' })
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
        <TemplateFormFields form={form} />

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
