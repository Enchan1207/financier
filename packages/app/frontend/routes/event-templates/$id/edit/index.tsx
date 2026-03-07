import { Button } from '@frontend/components/ui/button'
import { Input } from '@frontend/components/ui/input'
import { Label } from '@frontend/components/ui/label'
import { Separator } from '@frontend/components/ui/separator'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'

import { TEMPLATE_DETAILS } from '../../-components/template-data'
import type { FormItem } from '../../-components/template-form-item'
import {
  newFormItem,
  TemplateFormItem,
} from '../../-components/template-form-item'

const EventTemplateEditPage: React.FC = () => {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const original = TEMPLATE_DETAILS[id]

  const [templateName, setTemplateName] = useState(original?.name ?? '')
  const [items, setItems] = useState<FormItem[]>(
    original?.items.map((it) => ({
      uid: it.id,
      categoryId: it.categoryId,
      name: it.name,
      amount: String(it.amount),
      type: it.type,
    })) ?? [newFormItem()],
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

  const addItem = () => {
    setItems((prev) => [...prev, newFormItem()])
  }

  const removeItem = (uid: string) => {
    setItems((prev) => prev.filter((it) => it.uid !== uid))
  }

  const updateItem = (uid: string, patch: Partial<Omit<FormItem, 'uid'>>) => {
    setItems((prev) =>
      prev.map((it) => (it.uid === uid ? { ...it, ...patch } : it)),
    )
  }

  const isValid =
    templateName.trim().length > 0 &&
    items.length > 0 &&
    items.every(
      (it) => it.categoryId && it.name.trim() && parseInt(it.amount, 10) > 0,
    )

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
        <div className="space-y-1.5">
          <Label htmlFor="tmpl-name">テンプレート名 *</Label>
          <Input
            id="tmpl-name"
            value={templateName}
            onChange={(e) => {
              setTemplateName(e.target.value)
            }}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <h2 className="text-sm font-medium">取引定義</h2>
          {items.map((item, idx) => (
            <TemplateFormItem
              key={item.uid}
              item={item}
              index={idx}
              canRemove={items.length > 1}
              onRemove={() => {
                removeItem(item.uid)
              }}
              onUpdate={(patch) => {
                updateItem(item.uid, patch)
              }}
            />
          ))}
          <Button variant="outline" size="sm" onClick={addItem}>
            <PlusIcon />
            取引を追加
          </Button>
        </div>

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
