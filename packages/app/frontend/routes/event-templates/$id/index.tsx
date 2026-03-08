import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@frontend/components/ui/table'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeftIcon, PencilIcon } from 'lucide-react'

import { RegisterEventButton } from '../-components/register-event-button'
import { TEMPLATE_DETAILS } from '../-components/template-data'

const formatCurrency = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`

const EventTemplateDetailPage: React.FC = () => {
  const { id } = Route.useParams()
  const template = TEMPLATE_DETAILS[id]

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

  const netDefault = template.items.reduce(
    (sum, it) => sum + (it.type === 'income' ? it.amount : -it.amount),
    0,
  )

  return (
    <div className="max-w-2xl lg:max-w-full space-y-6">
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
              取引定義 {template.items.length} 件
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/event-templates/$id/edit" params={{ id }}>
              <PencilIcon />
              編集
            </Link>
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
                <TableHead className="h-9 pl-6 text-xs">種別</TableHead>
                <TableHead className="h-9 text-xs">カテゴリ</TableHead>
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
                  <TableCell className="py-2 pr-6 text-right font-mono text-xs">
                    {item.type === 'income' ? '+' : '-'}
                    {formatCurrency(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="py-2 pl-6 text-xs">
                  収支合計
                </TableCell>
                <TableCell className="py-2 pr-6 text-right font-mono text-xs font-bold">
                  {netDefault >= 0 ? '+' : ''}
                  {formatCurrency(netDefault)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* テンプレートからイベント作成（UC-5.5） */}
      <RegisterEventButton id={id} />
    </div>
  )
}

export const Route = createFileRoute('/event-templates/$id/')({
  component: EventTemplateDetailPage,
})
