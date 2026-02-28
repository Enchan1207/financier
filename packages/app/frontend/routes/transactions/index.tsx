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
import type { TransactionType } from '@frontend/lib/mock-data'
import {
  categories,
  events,
  formatCurrency,
  formatDate,
  TODAY,
  transactions,
} from '@frontend/lib/mock-data'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import React, { useState } from 'react'

// 年度（4月始まり）を返す
const getFiscalYear = (dateStr: string): number => {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const year = d.getFullYear()
  return month >= 4 ? year : year - 1
}

// グループキー: "YYYY-MM" 形式（ソート用）
const getGroupKey = (dateStr: string): string => {
  return dateStr.slice(0, 7) // "2026-02"
}

// 表示ラベル: "2025年度 2月"
const formatFiscalYearMonth = (dateStr: string): string => {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
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
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formType === 'expense' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => {
                  handleTypeChange('expense')
                }}
              >
                支出
              </Button>
              <Button
                type="button"
                variant={formType === 'income' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => {
                  handleTypeChange('income')
                }}
              >
                収入
              </Button>
            </div>
          </div>

          {/* カテゴリ */}
          <div className="space-y-1.5">
            <Label htmlFor="dialog-category">カテゴリ</Label>
            <Select value={formCategory} onValueChange={setFormCategory}>
              <SelectTrigger id="dialog-category">
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
              placeholder="例：スーパー"
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
            <Label htmlFor="dialog-event">イベント（任意）</Label>
            <Select value={formEvent} onValueChange={setFormEvent}>
              <SelectTrigger id="dialog-event">
                <SelectValue placeholder="なし" />
              </SelectTrigger>
              <SelectContent>
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
    groupMap.get(key)!.push(tx)
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
                const label = formatFiscalYearMonth(txList[0]!.transactionDate)
                const isFutureGroup = txList[0]!.transactionDate > TODAY

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
                            <Badge variant="outline" className="text-xs">
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
