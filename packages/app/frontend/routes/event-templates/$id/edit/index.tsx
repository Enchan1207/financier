import { Button } from '@frontend/components/ui/button'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

import { TEMPLATE_DETAILS } from '../../-components/template-data'
import { TemplateFormFields } from '../../-components/template-form-fields'
import { useTemplateForm } from '../../-components/use-template-form'

const EventTemplateEditPage: React.FC = () => {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const original = TEMPLATE_DETAILS[id]

  const {
    templateName,
    setTemplateName,
    items,
    addItem,
    removeItem,
    updateItem,
    isValid,
  } = useTemplateForm(
    original?.name,
    original?.items.map((it) => ({
      uid: it.id,
      categoryId: it.categoryId,
      name: it.name,
      amount: String(it.amount),
      type: it.type,
    })),
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

  const handleSave = () => {
    // モック：実際にはAPIを呼び出してテンプレートを更新する
    void navigate({ to: '/event-templates/$id', params: { id } })
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

      <div className="space-y-6 max-w-2xl lg:max-w-full">
        <TemplateFormFields
          templateName={templateName}
          onTemplateNameChange={setTemplateName}
          items={items}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onUpdateItem={updateItem}
        />

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!isValid}>
            テンプレートを更新
          </Button>
          <Button asChild variant="ghost">
            <Link to="/event-templates/$id" params={{ id }}>
              キャンセル
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/event-templates/$id/edit/')({
  component: EventTemplateEditPage,
})
