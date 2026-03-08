import { Badge } from '@frontend/components/ui/badge'
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@frontend/components/ui/toggle-group'
import dayjs from '@frontend/lib/date'
import { formatCurrency, formatDate } from '@frontend/lib/format'
import { TODAY } from '@frontend/lib/today'
import type { TransactionType } from '@frontend/lib/types'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import React, { useState } from 'react'

// モックデータ：本番ではAPIから取得する
const categories = [
  {
    id: 'cat-1',
    name: '食費',
    type: 'expense' as TransactionType,
    isSaving: false,
    color: 'var(--chart-1)',
  },
  {
    id: 'cat-2',
    name: '交通費',
    type: 'expense' as TransactionType,
    isSaving: false,
    color: 'var(--chart-2)',
  },
  {
    id: 'cat-3',
    name: '外食',
    type: 'expense' as TransactionType,
    isSaving: false,
    color: 'var(--chart-3)',
  },
  {
    id: 'cat-4',
    name: '娯楽・グッズ',
    type: 'expense' as TransactionType,
    isSaving: false,
    color: 'var(--chart-4)',
  },
  {
    id: 'cat-5',
    name: '衣服',
    type: 'expense' as TransactionType,
    isSaving: false,
    color: 'var(--chart-5)',
  },
  {
    id: 'cat-6',
    name: '日用品',
    type: 'expense' as TransactionType,
    isSaving: false,
    color: 'oklch(0.65 0.2 290)',
  },
  {
    id: 'cat-7',
    name: '美容',
    type: 'expense' as TransactionType,
    isSaving: false,
    color: 'oklch(0.72 0.18 350)',
  },
  {
    id: 'cat-8',
    name: '積立：遠征費',
    type: 'expense' as TransactionType,
    isSaving: true,
    color: 'oklch(0.60 0.15 210)',
  },
  {
    id: 'cat-9',
    name: '積立：グッズ',
    type: 'expense' as TransactionType,
    isSaving: true,
    color: 'oklch(0.55 0.15 150)',
  },
  {
    id: 'cat-11',
    name: '積立：旅行費',
    type: 'expense' as TransactionType,
    isSaving: true,
    color: 'oklch(0.60 0.18 50)',
  },
  {
    id: 'cat-12',
    name: '積立：機材費',
    type: 'expense' as TransactionType,
    isSaving: true,
    color: 'oklch(0.55 0.16 260)',
  },
  {
    id: 'cat-13',
    name: '積立：緊急資金',
    type: 'expense' as TransactionType,
    isSaving: true,
    color: 'oklch(0.50 0.10 180)',
  },
  {
    id: 'cat-10',
    name: '給与',
    type: 'income' as TransactionType,
    isSaving: false,
    color: 'oklch(0.70 0.15 140)',
  },
]

const transactions = [
  {
    id: 'tx-1',
    type: 'income' as TransactionType,
    amount: 282000,
    categoryId: 'cat-10',
    categoryName: '給与',
    transactionDate: '2026-02-03',
    name: '2月分給与',
  },
  {
    id: 'tx-2',
    type: 'expense' as TransactionType,
    amount: 500,
    categoryId: 'cat-2',
    categoryName: '交通費',
    transactionDate: '2026-02-03',
    name: '定期外乗車',
  },
  {
    id: 'tx-3',
    type: 'expense' as TransactionType,
    amount: 1850,
    categoryId: 'cat-1',
    categoryName: '食費',
    transactionDate: '2026-02-05',
    name: 'スーパー',
  },
  {
    id: 'tx-4',
    type: 'expense' as TransactionType,
    amount: 1200,
    categoryId: 'cat-3',
    categoryName: '外食',
    transactionDate: '2026-02-07',
    name: 'ランチ',
  },
  {
    id: 'tx-5',
    type: 'expense' as TransactionType,
    amount: 30000,
    categoryId: 'cat-8',
    categoryName: '積立：遠征費',
    transactionDate: '2026-02-08',
    name: '2月分積立',
  },
  {
    id: 'tx-6',
    type: 'expense' as TransactionType,
    amount: 6500,
    categoryId: 'cat-7',
    categoryName: '美容',
    transactionDate: '2026-02-10',
    name: 'カット・カラー',
  },
  {
    id: 'tx-7',
    type: 'expense' as TransactionType,
    amount: 2200,
    categoryId: 'cat-1',
    categoryName: '食費',
    transactionDate: '2026-02-12',
    name: 'スーパー',
  },
  {
    id: 'tx-8',
    type: 'expense' as TransactionType,
    amount: 150000,
    categoryId: 'cat-5',
    categoryName: '衣服',
    transactionDate: '2026-02-14',
    name: 'バレンタインコーデ',
    eventId: 'ev-1',
    eventName: 'バレンタインイベント',
  },
  {
    id: 'tx-9',
    type: 'expense' as TransactionType,
    amount: 4200,
    categoryId: 'cat-4',
    categoryName: '娯楽・グッズ',
    transactionDate: '2026-02-15',
    name: 'ぬいぐるみ',
    eventId: 'ev-1',
    eventName: 'バレンタインイベント',
  },
  {
    id: 'tx-10',
    type: 'expense' as TransactionType,
    amount: 1800,
    categoryId: 'cat-6',
    categoryName: '日用品',
    transactionDate: '2026-02-17',
    name: '薬局',
  },
  {
    id: 'tx-11',
    type: 'expense' as TransactionType,
    amount: 980,
    categoryId: 'cat-1',
    categoryName: '食費',
    transactionDate: '2026-02-18',
    name: 'コンビニ',
  },
  {
    id: 'tx-12',
    type: 'expense' as TransactionType,
    amount: 2800,
    categoryId: 'cat-2',
    categoryName: '交通費',
    transactionDate: '2026-02-20',
    name: '春ライブ 新幹線',
    eventId: 'ev-2',
    eventName: '春ライブ遠征',
  },
  {
    id: 'tx-13',
    type: 'expense' as TransactionType,
    amount: 8500,
    categoryId: 'cat-4',
    categoryName: '娯楽・グッズ',
    transactionDate: '2026-02-20',
    name: 'ライブグッズ',
    eventId: 'ev-2',
    eventName: '春ライブ遠征',
  },
  {
    id: 'tx-14',
    type: 'expense' as TransactionType,
    amount: 2400,
    categoryId: 'cat-3',
    categoryName: '外食',
    transactionDate: '2026-02-21',
    name: '遠征ご飯',
    eventId: 'ev-2',
    eventName: '春ライブ遠征',
  },
  {
    id: 'tx-15',
    type: 'expense' as TransactionType,
    amount: 1600,
    categoryId: 'cat-1',
    categoryName: '食費',
    transactionDate: '2026-02-24',
    name: 'スーパー',
  },
  {
    id: 'tx-16',
    type: 'expense' as TransactionType,
    amount: 3200,
    categoryId: 'cat-3',
    categoryName: '外食',
    transactionDate: '2026-02-26',
    name: '友人と夕飯',
  },
  {
    id: 'tx-17',
    type: 'expense' as TransactionType,
    amount: 1200,
    categoryId: 'cat-1',
    categoryName: '食費',
    transactionDate: '2026-02-28',
    name: 'コンビニ',
  },
  {
    id: 'tx-18',
    type: 'expense' as TransactionType,
    amount: 5500,
    categoryId: 'cat-4',
    categoryName: '娯楽・グッズ',
    transactionDate: '2026-03-05',
    name: '新グッズ発売',
    eventId: 'ev-3',
    eventName: '春グッズ',
  },
  {
    id: 'tx-19',
    type: 'expense' as TransactionType,
    amount: 8000,
    categoryId: 'cat-2',
    categoryName: '交通費',
    transactionDate: '2026-03-20',
    name: '春遠征 新幹線',
    eventId: 'ev-2',
    eventName: '春ライブ遠征',
  },
  {
    id: 'tx-20',
    type: 'expense' as TransactionType,
    amount: 12000,
    categoryId: 'cat-4',
    categoryName: '娯楽・グッズ',
    transactionDate: '2026-03-20',
    name: '春ライブグッズ予定',
    eventId: 'ev-2',
    eventName: '春ライブ遠征',
  },
  {
    id: 'tx-21',
    type: 'expense' as TransactionType,
    amount: 3000,
    categoryId: 'cat-3',
    categoryName: '外食',
    transactionDate: '2026-03-21',
    name: '遠征飯予定',
    eventId: 'ev-2',
    eventName: '春ライブ遠征',
  },
  {
    id: 'tx-22',
    type: 'expense' as TransactionType,
    amount: 15000,
    categoryId: 'cat-5',
    categoryName: '衣服',
    transactionDate: '2026-04-05',
    name: '春物購入予定',
  },
]

const events = [
  {
    id: 'ev-1',
    name: 'バレンタインイベント',
    dateRange: { start: '2026-02-14' },
    totalAmount: 12000,
  },
  {
    id: 'ev-2',
    name: '春ライブ遠征',
    dateRange: { start: '2026-02-20', end: '2026-03-21' },
    totalAmount: 35700,
  },
  {
    id: 'ev-3',
    name: '春グッズ',
    dateRange: { start: '2026-03-05' },
    totalAmount: 5500,
  },
]

const categoryColorMap: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.id, c.color]),
)

// 年度（4月始まり）を返す
const getFiscalYear = (dateStr: string): number => {
  const d = dayjs(dateStr)
  const month = d.month() + 1
  const year = d.year()
  return month >= 4 ? year : year - 1
}

// グループキー: "YYYY-MM" 形式（ソート用）
const getGroupKey = (dateStr: string): string => {
  return dateStr.slice(0, 7) // "2026-02"
}

// 表示ラベル: "2025年度 2月"
const formatFiscalYearMonth = (dateStr: string): string => {
  const d = dayjs(dateStr)
  const month = d.month() + 1
  const fy = getFiscalYear(dateStr)
  return `${fy}年度 ${month}月`
}

const AddTransactionDialog: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [formType, setFormType] = useState<TransactionType>('expense')
  const [formCategory, setFormCategory] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formName, setFormName] = useState('')
  const [formDate, setFormDate] = useState(TODAY)
  const [formEvent, setFormEvent] = useState('')

  const filteredCategories = categories.filter((c) => c.type === formType)
  const canSubmit = formCategory && formAmount && formName && formDate

  const handleTypeChange = (t: TransactionType) => {
    setFormType(t)
    setFormCategory('')
  }

  const handleSubmit = () => {
    // モック: 実際の保存は行わない
    setOpen(false)
    setFormType('expense')
    setFormCategory('')
    setFormAmount('')
    setFormName('')
    setFormDate(TODAY)
    setFormEvent('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          追加
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>取引を追加</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* 収支種別 */}
          <div className="space-y-1.5">
            <Label>種別</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={formType}
              onValueChange={(v) => {
                if (v) handleTypeChange(v as TransactionType)
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

          {/* カテゴリ */}
          <div className="space-y-1.5">
            <Label htmlFor="dialog-category">カテゴリ</Label>
            <Select value={formCategory} onValueChange={setFormCategory}>
              <SelectTrigger id="dialog-category" className="w-full">
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 金額 */}
          <div className="space-y-1.5">
            <Label htmlFor="dialog-amount">金額</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                ¥
              </span>
              <Input
                id="dialog-amount"
                type="number"
                placeholder="0"
                value={formAmount}
                onChange={(e) => {
                  setFormAmount(e.target.value)
                }}
                className="pl-7"
              />
            </div>
          </div>

          {/* 内容 */}
          <div className="space-y-1.5">
            <Label htmlFor="dialog-name">内容</Label>
            <Input
              id="dialog-name"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value)
              }}
            />
          </div>

          {/* 日付 */}
          <div className="space-y-1.5">
            <Label htmlFor="dialog-date">日付</Label>
            <Input
              id="dialog-date"
              type="date"
              value={formDate}
              onChange={(e) => {
                setFormDate(e.target.value)
              }}
            />
          </div>

          {/* イベント（任意） */}
          <div className="space-y-1.5">
            <Label htmlFor="dialog-event">イベント</Label>
            <Select
              value={formEvent || '_none'}
              onValueChange={(v) => {
                setFormEvent(v === '_none' ? '' : v)
              }}
            >
              <SelectTrigger id="dialog-event" className="w-full">
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

          <Button
            className="w-full"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            記録する
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const TransactionsPage: React.FC = () => {
  // 日付降順（未来が先頭）
  const sorted = [...transactions].sort((a, b) =>
    b.transactionDate.localeCompare(a.transactionDate),
  )

  // 月ごとにグループ化（挿入順 = 降順）
  const groupMap = new Map<string, typeof transactions>()
  for (const tx of sorted) {
    const key = getGroupKey(tx.transactionDate)
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)?.push(tx)
  }
  const groups = [...groupMap.entries()]

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Card className="flex flex-col flex-1 min-h-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">取引一覧</CardTitle>
            <AddTransactionDialog />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-1 md:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead>内容</TableHead>
                <TableHead className="hidden md:table-cell">カテゴリ</TableHead>
                <TableHead className="text-right">金額</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map(([key, txList]) => {
                // key = "YYYY-MM"、先頭取引から年度月ラベルを生成
                const label = formatFiscalYearMonth(
                  txList[0]?.transactionDate ?? '',
                )
                const isFutureGroup = (txList[0]?.transactionDate ?? '') > TODAY

                return (
                  <React.Fragment key={key}>
                    {/* 月区切り行 */}
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell
                        colSpan={4}
                        className="py-1.5 text-xs font-semibold text-muted-foreground tracking-wide"
                      >
                        {label}
                        {isFutureGroup && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            予定
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* 取引行 */}
                    {txList.map((tx) => {
                      const isFuture = tx.transactionDate > TODAY
                      return (
                        <TableRow
                          key={tx.id}
                          className={isFuture ? 'opacity-60' : undefined}
                        >
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {formatDate(tx.transactionDate)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm">{tx.name}</span>
                              {tx.eventName && (
                                <span className="text-xs text-muted-foreground">
                                  {tx.eventName}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge
                              variant="outline"
                              className="text-xs border-[var(--badge-color)] text-[var(--badge-color)]"
                              style={
                                {
                                  '--badge-color':
                                    categoryColorMap[tx.categoryId],
                                } as React.CSSProperties
                              }
                            >
                              {tx.categoryName}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono text-sm tabular-nums ${
                              tx.type === 'income'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-foreground'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'}
                            {formatCurrency(tx.amount)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/transactions/')({
  component: TransactionsPage,
})
