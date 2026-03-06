import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import { Input } from '@frontend/components/ui/input'
import { Label } from '@frontend/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select'
import { Separator } from '@frontend/components/ui/separator'
import dayjs from '@frontend/lib/date'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

// 選択可能カテゴリ：isSaving=false のアクティブカテゴリのみ（UC-5.4）
const SELECTABLE_CATEGORIES = [
  { id: 'cat-1', name: '食費' },
  { id: 'cat-2', name: '交通費' },
  { id: 'cat-3', name: '外食' },
  { id: 'cat-4', name: '娯楽・グッズ' },
  { id: 'cat-5', name: '衣服' },
  { id: 'cat-6', name: '日用品' },
  { id: 'cat-7', name: '美容' },
]

type FormItem = {
  uid: string
  categoryId: string
  name: string
  amount: string
}

const newItem = (): FormItem => ({
  uid: `item-${dayjs().valueOf()}-${Math.random()}`,
  categoryId: '',
  name: '',
  amount: '',
})

const EventTemplateNewPage: React.FC = () => {
  const navigate = useNavigate()
  const [templateName, setTemplateName] = useState('')
  const [items, setItems] = useState<FormItem[]>([newItem()])

  const addItem = () => {
    setItems((prev) => [...prev, newItem()])
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

      <div className="space-y-6 max-w-2xl">
        {/* テンプレート名 */}
        <div className="space-y-1.5">
          <Label htmlFor="tmpl-name">テンプレート名 *</Label>
          <Input
            id="tmpl-name"
            value={templateName}
            onChange={(e) => {
              setTemplateName(e.target.value)
            }}
            placeholder="例：ライブ遠征セット"
          />
        </div>

        <Separator />

        {/* 取引定義リスト */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium">取引定義</h2>
          {items.map((item, idx) => (
            <Card key={item.uid}>
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">
                    取引 {idx + 1}
                  </CardTitle>
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        removeItem(item.uid)
                      }}
                    >
                      <Trash2Icon className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`cat-${item.uid}`}>カテゴリ *</Label>
                  <Select
                    value={item.categoryId}
                    onValueChange={(v) => {
                      updateItem(item.uid, { categoryId: v })
                    }}
                  >
                    <SelectTrigger id={`cat-${item.uid}`} className="w-full">
                      <SelectValue placeholder="カテゴリを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {SELECTABLE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`name-${item.uid}`}>内容名 *</Label>
                  <Input
                    id={`name-${item.uid}`}
                    value={item.name}
                    onChange={(e) => {
                      updateItem(item.uid, { name: e.target.value })
                    }}
                    placeholder="例：新幹線代"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`amount-${item.uid}`}>
                    デフォルト金額（円）*
                  </Label>
                  <Input
                    id={`amount-${item.uid}`}
                    type="number"
                    min={1}
                    value={item.amount}
                    onChange={(e) => {
                      updateItem(item.uid, { amount: e.target.value })
                    }}
                    placeholder="例：8000"
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" size="sm" onClick={addItem}>
            <PlusIcon />
            取引を追加
          </Button>
        </div>

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
