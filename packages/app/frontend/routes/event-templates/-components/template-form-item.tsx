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
import dayjs from '@frontend/lib/date'
import { Trash2Icon } from 'lucide-react'

// 選択可能カテゴリ：isSaving=false のアクティブカテゴリのみ（UC-5.4）
export const SELECTABLE_CATEGORIES = [
  { id: 'cat-1', name: '食費' },
  { id: 'cat-2', name: '交通費' },
  { id: 'cat-3', name: '外食' },
  { id: 'cat-4', name: '娯楽・グッズ' },
  { id: 'cat-5', name: '衣服' },
  { id: 'cat-6', name: '日用品' },
  { id: 'cat-7', name: '美容' },
]

export type FormItem = {
  uid: string
  categoryId: string
  name: string
  amount: string
  type: 'income' | 'expense'
}

export const newFormItem = (): FormItem => ({
  uid: `item-${dayjs().valueOf()}-${Math.random()}`,
  categoryId: '',
  name: '',
  amount: '',
  type: 'expense',
})

type Props = {
  item: FormItem
  index: number
  canRemove: boolean
  onRemove: () => void
  onUpdate: (patch: Partial<Omit<FormItem, 'uid'>>) => void
}

export const TemplateFormItem: React.FC<Props> = ({
  item,
  index,
  canRemove,
  onRemove,
  onUpdate,
}) => (
  <Card>
    <CardHeader className="pb-2 pt-3 px-4">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm text-muted-foreground">
          取引 {index + 1}
        </CardTitle>
        {canRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2Icon className="size-4 text-destructive" />
          </Button>
        )}
      </div>
    </CardHeader>
    <CardContent className="px-4 pb-4 space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={`type-${item.uid}`}>種別 *</Label>
        <Select
          value={item.type}
          onValueChange={(v: 'income' | 'expense') => {
            onUpdate({ type: v })
          }}
        >
          <SelectTrigger id={`type-${item.uid}`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">収入</SelectItem>
            <SelectItem value="expense">支出</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`cat-${item.uid}`}>カテゴリ *</Label>
        <Select
          value={item.categoryId}
          onValueChange={(v) => {
            onUpdate({ categoryId: v })
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
            onUpdate({ name: e.target.value })
          }}
          placeholder="例：新幹線代"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`amount-${item.uid}`}>デフォルト金額（円）*</Label>
        <Input
          id={`amount-${item.uid}`}
          type="number"
          min={1}
          value={item.amount}
          onChange={(e) => {
            onUpdate({ amount: e.target.value })
          }}
          placeholder="例：8000"
        />
      </div>
    </CardContent>
  </Card>
)
