import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog'
import { Input } from '@frontend/components/ui/input'
import { Label } from '@frontend/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@frontend/components/ui/table'
import dayjs from '@frontend/lib/date'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeftIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import { BulkRegisterDialog } from '../-components/bulk-register-dialog'

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

type TemplateItem = {
  id: string
  categoryId: string
  categoryName: string
  name: string
  amount: number
  type: 'income' | 'expense'
}

type TemplateDetail = {
  id: string
  name: string
  items: TemplateItem[]
}

// モックデータ：本番ではAPIから /event-templates/:id を取得する
const TEMPLATE_DETAILS: Record<string, TemplateDetail> = {
  'tmpl-1': {
    id: 'tmpl-1',
    name: 'ライブ遠征',
    items: [
      {
        id: 'i-1',
        categoryId: 'cat-2',
        categoryName: '交通費',
        name: '新幹線代',
        amount: 8000,
        type: 'expense',
      },
      {
        id: 'i-2',
        categoryId: 'cat-4',
        categoryName: '娯楽・グッズ',
        name: 'ライブグッズ',
        amount: 10000,
        type: 'expense',
      },
      {
        id: 'i-3',
        categoryId: 'cat-3',
        categoryName: '外食',
        name: '遠征ご飯',
        amount: 3000,
        type: 'expense',
      },
    ],
  },
  'tmpl-2': {
    id: 'tmpl-2',
    name: 'グッズ購入',
    items: [
      {
        id: 'i-4',
        categoryId: 'cat-4',
        categoryName: '娯楽・グッズ',
        name: 'グッズ購入',
        amount: 5000,
        type: 'expense',
      },
      {
        id: 'i-5',
        categoryId: 'cat-2',
        categoryName: '交通費',
        name: '交通費',
        amount: 1000,
        type: 'expense',
      },
    ],
  },
  'tmpl-3': {
    id: 'tmpl-3',
    name: 'イベント参加（日帰り）',
    items: [
      {
        id: 'i-6',
        categoryId: 'cat-2',
        categoryName: '交通費',
        name: '電車代',
        amount: 2000,
        type: 'expense',
      },
      {
        id: 'i-7',
        categoryId: 'cat-4',
        categoryName: '娯楽・グッズ',
        name: 'チケット',
        amount: 8000,
        type: 'expense',
      },
      {
        id: 'i-8',
        categoryId: 'cat-3',
        categoryName: '外食',
        name: '食事',
        amount: 1500,
        type: 'expense',
      },
    ],
  },
  'tmpl-4': {
    id: 'tmpl-4',
    name: '給料日',
    items: [
      {
        id: 'i-9',
        categoryId: 'cat-1',
        categoryName: '給与・賞与',
        name: '給与',
        amount: 250000,
        type: 'income',
      },
      {
        id: 'i-10',
        categoryId: 'cat-1',
        categoryName: '給与・賞与',
        name: 'RW手当',
        amount: 5000,
        type: 'income',
      },
      {
        id: 'i-11',
        categoryId: 'cat-5',
        categoryName: '社会保険料',
        name: '厚生年金',
        amount: 15000,
        type: 'expense',
      },
      {
        id: 'i-12',
        categoryId: 'cat-6',
        categoryName: '税金',
        name: '住民税',
        amount: 8000,
        type: 'expense',
      },
      {
        id: 'i-13',
        categoryId: 'cat-6',
        categoryName: '税金',
        name: '市県民税',
        amount: 5000,
        type: 'expense',
      },
    ],
  },
}

type EditFormItem = {
  uid: string
  categoryId: string
  name: string
  amount: string
  type: 'income' | 'expense'
}

const toEditItem = (item: TemplateItem): EditFormItem => ({
  uid: item.id,
  categoryId: item.categoryId,
  name: item.name,
  amount: String(item.amount),
  type: item.type,
})

const newEditItem = (): EditFormItem => ({
  uid: `item-${dayjs().valueOf()}-${Math.random()}`,
  categoryId: '',
  name: '',
  amount: '',
  type: 'expense',
})

const formatCurrency = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`

const EventTemplateDetailPage: React.FC = () => {
  const { id } = Route.useParams()
  const original = TEMPLATE_DETAILS[id]

  const [template, setTemplate] = useState<TemplateDetail | undefined>(original)
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState(original?.name ?? '')
  const [editItems, setEditItems] = useState<EditFormItem[]>(
    original?.items.map(toEditItem) ?? [],
  )

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

  const totalDefault = template.items.reduce((sum, it) => sum + it.amount, 0)

  const addEditItem = () => {
    setEditItems((prev) => [...prev, newEditItem()])
  }

  const removeEditItem = (uid: string) => {
    setEditItems((prev) => prev.filter((it) => it.uid !== uid))
  }

  const updateEditItem = (
    uid: string,
    patch: Partial<Omit<EditFormItem, 'uid'>>,
  ) => {
    setEditItems((prev) =>
      prev.map((it) => (it.uid === uid ? { ...it, ...patch } : it)),
    )
  }

  const isEditValid =
    editName.trim().length > 0 &&
    editItems.length > 0 &&
    editItems.every(
      (it) => it.categoryId && it.name.trim() && parseInt(it.amount, 10) > 0,
    )

  const handleEditSave = () => {
    // モック：実際にはAPIを呼び出してテンプレートを更新する
    const updatedItems: TemplateItem[] = editItems.map((it) => {
      const cat = SELECTABLE_CATEGORIES.find((c) => c.id === it.categoryId)
      return {
        id: it.uid,
        categoryId: it.categoryId,
        categoryName: cat?.name ?? '',
        name: it.name,
        amount: parseInt(it.amount, 10),
        type: it.type,
      }
    })
    setTemplate({ ...template, name: editName, items: updatedItems })
    setEditOpen(false)
  }

  const handleEditOpen = () => {
    setEditName(template.name)
    setEditItems(template.items.map(toEditItem))
    setEditOpen(true)
  }

  const bulkItems = template.items.map((it) => ({
    id: it.id,
    categoryName: it.categoryName,
    name: it.name,
    defaultAmount: it.amount,
    type: it.type,
  }))

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/event-templates">
            <ArrowLeftIcon />
            テンプレート一覧へ
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{template.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              取引定義 {template.items.length} 件 / デフォルト合計{' '}
              {formatCurrency(totalDefault)}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleEditOpen}>
            <PencilIcon />
            編集
          </Button>
        </div>
      </div>

      {/* 取引定義一覧 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">取引定義</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-9 pl-6 text-xs">カテゴリ</TableHead>
                <TableHead className="h-9 text-xs">内容</TableHead>
                <TableHead className="h-9 pr-6 text-right text-xs">
                  デフォルト金額
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {template.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="py-2 pl-6 text-xs">
                    {item.categoryName}
                  </TableCell>
                  <TableCell className="py-2 text-xs">{item.name}</TableCell>
                  <TableCell className="py-2 pr-6 text-right font-mono text-xs">
                    {formatCurrency(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* テンプレートからイベント作成（UC-5.5） */}
      <BulkRegisterDialog
        templateName={template.name}
        items={bulkItems}
        trigger={<Button>このテンプレートでイベント作成</Button>}
      />

      {/* 編集ダイアログ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger className="hidden" />
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>テンプレートを編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-tmpl-name">テンプレート名 *</Label>
              <Input
                id="edit-tmpl-name"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value)
                }}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">取引定義</p>
              {editItems.map((item, idx) => (
                <Card key={item.uid}>
                  <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-muted-foreground">
                        取引 {idx + 1}
                      </CardTitle>
                      {editItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            removeEditItem(item.uid)
                          }}
                        >
                          <Trash2Icon className="size-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`edit-cat-${item.uid}`}>カテゴリ *</Label>
                      <Select
                        value={item.categoryId}
                        onValueChange={(v) => {
                          updateEditItem(item.uid, { categoryId: v })
                        }}
                      >
                        <SelectTrigger
                          id={`edit-cat-${item.uid}`}
                          className="w-full"
                        >
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
                      <Label htmlFor={`edit-name-${item.uid}`}>内容名 *</Label>
                      <Input
                        id={`edit-name-${item.uid}`}
                        value={item.name}
                        onChange={(e) => {
                          updateEditItem(item.uid, { name: e.target.value })
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`edit-amount-${item.uid}`}>
                        デフォルト金額（円）*
                      </Label>
                      <Input
                        id={`edit-amount-${item.uid}`}
                        type="number"
                        min={1}
                        value={item.amount}
                        onChange={(e) => {
                          updateEditItem(item.uid, { amount: e.target.value })
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" size="sm" onClick={addEditItem}>
                <PlusIcon />
                取引を追加
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditSave} disabled={!isEditValid}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const Route = createFileRoute('/event-templates/$id/')({
  component: EventTemplateDetailPage,
})
