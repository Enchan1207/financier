import { Button } from '@frontend/components/ui/button'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

import { TemplateFormFields } from '../-components/template-form-fields'
import { useTemplateForm } from '../-components/use-template-form'

const EventTemplateNewPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    templateName,
    setTemplateName,
    items,
    addItem,
    removeItem,
    updateItem,
    isValid,
  } = useTemplateForm()

  const handleSave = () => {
    // モック：実際にはAPIを呼び出してテンプレートを作成する
    void navigate({ to: '/event-templates' })
  }

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

      <div className="space-y-6 max-w-2xl lg:max-w-full">
        <TemplateFormFields
          templateName={templateName}
          onTemplateNameChange={setTemplateName}
          items={items}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onUpdateItem={updateItem}
          namePlaceholder="例：ライブ遠征セット"
        />

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!isValid}>
            テンプレートを保存
          </Button>
          <Button asChild variant="ghost">
            <Link to="/event-templates">キャンセル</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/event-templates/new/')({
  component: EventTemplateNewPage,
})
