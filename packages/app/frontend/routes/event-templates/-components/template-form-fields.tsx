import { Button } from '@frontend/components/ui/button'
import { Input } from '@frontend/components/ui/input'
import { Label } from '@frontend/components/ui/label'
import { Separator } from '@frontend/components/ui/separator'
import { PlusIcon } from 'lucide-react'

import type { FormItem } from './template-form-item'
import { TemplateFormItem } from './template-form-item'

type Props = {
  templateName: string
  onTemplateNameChange: (name: string) => void
  items: FormItem[]
  onAddItem: () => void
  onRemoveItem: (uid: string) => void
  onUpdateItem: (uid: string, patch: Partial<Omit<FormItem, 'uid'>>) => void
  namePlaceholder?: string
}

export const TemplateFormFields: React.FC<Props> = ({
  templateName,
  onTemplateNameChange,
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  namePlaceholder,
}) => {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="tmpl-name">テンプレート名 *</Label>
        <Input
          id="tmpl-name"
          value={templateName}
          onChange={(e) => {
            onTemplateNameChange(e.target.value)
          }}
          placeholder={namePlaceholder}
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
              onRemoveItem(item.uid)
            }}
            onUpdate={(patch) => {
              onUpdateItem(item.uid, patch)
            }}
          />
        ))}
        <Button
          variant="outline"
          className="rounded-full"
          size="sm"
          onClick={onAddItem}
        >
          <PlusIcon />
          追加
        </Button>
      </div>
    </>
  )
}
