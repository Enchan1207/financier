import { Button } from '@frontend/components/ui/button'
import { Input } from '@frontend/components/ui/input'
import { Label } from '@frontend/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@frontend/components/ui/table'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { useState } from 'react'

import { TEMPLATE_DETAILS } from '../../-components/template-data'

const formatCurrency = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`

const EventTemplateRegisterPage: React.FC = () => {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const template = TEMPLATE_DETAILS[id]

  const [date, setDate] = useState('')
  const [amounts, setAmounts] = useState<Record<string, string>>(
    template
      ? Object.fromEntries(
          template.items.map((item) => [item.id, String(item.amount)]),
        )
      : {},
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

  const total = template.items.reduce((sum, item) => {
    const v = parseInt(amounts[item.id] ?? '0', 10)
    const signed = isNaN(v) ? 0 : item.type === 'income' ? v : -v
    return sum + signed
  }, 0)

  const handleSave = () => {
    // モック：実際にはAPIを呼び出してトランザクションを一括作成する
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
        <h1 className="text-2xl font-bold">一括登録：{template.name}</h1>
      </div>

      <div className="max-w-2xl lg:max-w-full space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="bulk-date">取引日（全件共通）*</Label>
          <Input
            id="bulk-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
            }}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 text-xs">種別</TableHead>
              <TableHead className="h-8 text-xs">カテゴリ</TableHead>
              <TableHead className="h-8 text-xs">内容</TableHead>
              <TableHead className="h-8 text-right text-xs">
                金額（円）
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {template.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="py-2 text-xs">
                  {item.type === 'income' ? (
                    <span className="text-emerald-600">収入</span>
                  ) : (
                    <span className="text-rose-600">支出</span>
                  )}
                </TableCell>
                <TableCell className="py-2 text-xs">
                  {item.categoryName}
                </TableCell>
                <TableCell className="py-2 text-xs">{item.name}</TableCell>
                <TableCell className="py-2 text-right">
                  <Input
                    type="number"
                    min={0}
                    value={amounts[item.id] ?? ''}
                    onChange={(e) => {
                      setAmounts((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }}
                    className="h-7 w-28 text-right text-xs"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-right text-sm font-bold">
          収支合計：{total >= 0 ? '+' : ''}
          {formatCurrency(total)}
        </p>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!date}>
            一括保存
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

export const Route = createFileRoute('/event-templates/$id/register/')({
  component: EventTemplateRegisterPage,
})
