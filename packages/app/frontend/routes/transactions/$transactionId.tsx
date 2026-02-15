import { Badge } from '@frontend/components/ui/badge'
import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import { useTransactionDetailQuery } from '@frontend/hooks/use-mock-finance-store'
import { formatCurrency, formatDate } from '@frontend/lib/financier-format'
import { createFileRoute, Link } from '@tanstack/react-router'

const TransactionDetailPage = () => {
  const { transactionId } = Route.useParams()
  const { data } = useTransactionDetailQuery(transactionId)

  if (data === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>取引が見つかりません</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/transactions">一覧へ戻る</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>取引詳細</CardTitle>
          <CardDescription>ID: {data.id}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>日付: {formatDate(data.transactionDate)}</p>
          <p>年度帰属: {data.fiscalYear}年度</p>
          <p>
            種別:{' '}
            <Badge variant={data.type === 'income' ? 'secondary' : 'outline'}>
              {data.type === 'income' ? '収入' : '支出'}
            </Badge>
          </p>
          <p>カテゴリ: {data.categoryName}</p>
          <p>金額: {formatCurrency(data.amount)}</p>
          <p>イベント: {data.eventName ?? 'なし'}</p>
          <p>メモ: {data.memo ?? 'なし'}</p>
          <p>
            状態:{' '}
            {data.isFuture ? (
              <Badge>未来日取引</Badge>
            ) : (
              <Badge variant="outline">確定済み</Badge>
            )}
          </p>
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="w-fit">
        <Link to="/transactions">一覧へ戻る</Link>
      </Button>
    </div>
  )
}

export const Route = createFileRoute('/transactions/$transactionId')({
  component: TransactionDetailPage,
})
