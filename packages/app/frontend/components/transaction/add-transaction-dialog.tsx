import { CategorySelect } from '@frontend/components/category/category-select'
import type {
  CategoryColor,
  CategoryIconType,
} from '@frontend/components/category/types'
import { Button } from '@frontend/components/ui/button'
import {
  Dialog,
  DialogContent,
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
  ToggleGroup,
  ToggleGroupItem,
} from '@frontend/components/ui/toggle-group'
import { TODAY } from '@frontend/lib/today'
import type { TransactionType } from '@frontend/lib/types'
import { useForm } from '@tanstack/react-form'
import { Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

// モックデータ：本番ではAPIから取得する
const categories: {
  id: string
  name: string
  type: TransactionType
  isSaving: boolean
  icon: CategoryIconType
  color: CategoryColor
}[] = [
  {
    id: 'cat-1',
    name: '食費',
    type: 'expense',
    isSaving: false,
    icon: 'utensils',
    color: 'red',
  },
  {
    id: 'cat-2',
    name: '交通費',
    type: 'expense',
    isSaving: false,
    icon: 'bus',
    color: 'blue',
  },
  {
    id: 'cat-3',
    name: '外食',
    type: 'expense',
    isSaving: false,
    icon: 'coffee',
    color: 'orange',
  },
  {
    id: 'cat-4',
    name: '娯楽・グッズ',
    type: 'expense',
    isSaving: false,
    icon: 'music',
    color: 'purple',
  },
  {
    id: 'cat-5',
    name: '衣服',
    type: 'expense',
    isSaving: false,
    icon: 'shirt',
    color: 'pink',
  },
  {
    id: 'cat-6',
    name: '日用品',
    type: 'expense',
    isSaving: false,
    icon: 'shopping_cart',
    color: 'teal',
  },
  {
    id: 'cat-7',
    name: '美容',
    type: 'expense',
    isSaving: false,
    icon: 'heart_pulse',
    color: 'pink',
  },
  {
    id: 'cat-8',
    name: '積立：遠征費',
    type: 'expense',
    isSaving: true,
    icon: 'plane',
    color: 'blue',
  },
  {
    id: 'cat-9',
    name: '積立：グッズ',
    type: 'expense',
    isSaving: true,
    icon: 'gift',
    color: 'purple',
  },
  {
    id: 'cat-11',
    name: '積立：旅行費',
    type: 'expense',
    isSaving: true,
    icon: 'plane',
    color: 'teal',
  },
  {
    id: 'cat-12',
    name: '積立：機材費',
    type: 'expense',
    isSaving: true,
    icon: 'zap',
    color: 'yellow',
  },
  {
    id: 'cat-13',
    name: '積立：緊急資金',
    type: 'expense',
    isSaving: true,
    icon: 'piggy_bank',
    color: 'green',
  },
  {
    id: 'cat-10',
    name: '給与',
    type: 'income',
    isSaving: false,
    icon: 'wallet',
    color: 'green',
  },
]

const events = [
  { id: 'ev-1', name: 'バレンタインイベント' },
  { id: 'ev-2', name: '春ライブ遠征' },
  { id: 'ev-3', name: '春グッズ' },
]

const formSchema = z.object({
  type: z.enum(['income', 'expense'] as const),
  categoryId: z.string().min(1),
  amount: z.string().refine((v) => v !== '' && Number(v) > 0),
  name: z.string().min(1),
  transactionDate: z.string().min(1),
  eventId: z.string(),
})

type FormValues = z.infer<typeof formSchema>

const defaultValues: FormValues = {
  type: 'expense',
  categoryId: '',
  amount: '',
  name: '',
  transactionDate: TODAY,
  eventId: '',
}

type AddTransactionDialogProps = {
  trigger: React.ReactNode
}

export const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({
  trigger,
}) => {
  const [open, setOpen] = useState(false)

  const form = useForm({
    defaultValues,
    validators: { onChange: formSchema },
    onSubmit: async () => {
      // モック：本番ではAPIを呼び出す
      await new Promise((resolve) => setTimeout(resolve, 600))
      setOpen(false)
    },
  })

  const handleOpenChange = (v: boolean) => {
    if (form.state.isSubmitting) return
    if (!v) form.reset()
    setOpen(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>取引を記録</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* 収支種別 */}
          <form.Field
            name="type"
            children={(field) => (
              <div className="space-y-1.5">
                <Label>種別</Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={field.state.value}
                  onValueChange={(v) => {
                    if (!v) return
                    field.handleChange(v as TransactionType)
                    form.setFieldValue('categoryId', '')
                  }}
                  className="w-full"
                >
                  <ToggleGroupItem value="expense" className="flex-1">
                    支出
                  </ToggleGroupItem>
                  <ToggleGroupItem value="income" className="flex-1">
                    収入
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}
          />

          {/* カテゴリ（種別連動） */}
          <form.Subscribe
            selector={(state) => state.values.type}
            children={(type) => (
              <form.Field
                name="categoryId"
                children={(field) => {
                  const filtered = categories.filter((c) => c.type === type)
                  return (
                    <div className="space-y-1.5">
                      <Label htmlFor="quick-tx-category">カテゴリ</Label>
                      <CategorySelect
                        id="quick-tx-category"
                        className="w-full"
                        categories={filtered}
                        value={field.state.value}
                        onValueChange={field.handleChange}
                      />
                    </div>
                  )
                }}
              />
            )}
          />

          {/* 金額 */}
          <form.Field
            name="amount"
            children={(field) => (
              <div className="space-y-1.5">
                <Label htmlFor="quick-tx-amount">金額</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    ¥
                  </span>
                  <Input
                    id="quick-tx-amount"
                    type="number"
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value)
                    }}
                    onBlur={field.handleBlur}
                    className="pl-7"
                  />
                </div>
              </div>
            )}
          />

          {/* 内容 */}
          <form.Field
            name="name"
            children={(field) => (
              <div className="space-y-1.5">
                <Label htmlFor="quick-tx-name">内容</Label>
                <Input
                  id="quick-tx-name"
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                  }}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          />

          {/* 日付 */}
          <form.Field
            name="transactionDate"
            children={(field) => (
              <div className="space-y-1.5">
                <Label htmlFor="quick-tx-date">日付</Label>
                <Input
                  id="quick-tx-date"
                  type="date"
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                  }}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          />

          {/* イベント（任意） */}
          <form.Field
            name="eventId"
            children={(field) => (
              <div className="space-y-1.5">
                <Label htmlFor="quick-tx-event">イベント</Label>
                <Select
                  value={field.state.value || '_none'}
                  onValueChange={(v) => {
                    field.handleChange(v === '_none' ? '' : v)
                  }}
                >
                  <SelectTrigger id="quick-tx-event" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">なし</SelectItem>
                    {events.map((ev) => (
                      <SelectItem key={ev.id} value={ev.id}>
                        {ev.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />
        </div>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting] as const}
          children={([canSubmit, isSubmitting]) => (
            <Button
              className="w-full"
              disabled={!canSubmit || isSubmitting}
              onClick={() => form.handleSubmit()}
            >
              <Loader2Icon
                className={`animate-spin ${isSubmitting ? '' : 'hidden'}`}
              />
              記録する
            </Button>
          )}
        />
      </DialogContent>
    </Dialog>
  )
}
