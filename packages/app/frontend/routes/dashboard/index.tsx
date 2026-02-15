import { PageHeader } from '@frontend/components/layout/page-header'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import { useDashboardQuery } from '@frontend/hooks/use-mock-finance-store'
import {
  formatCurrency,
  formatFiscalYear,
} from '@frontend/lib/financier-format'
import { createFileRoute, Link } from '@tanstack/react-router'

const DashboardPage = () => {
  const { data } = useDashboardQuery()

  return (
    <div className="grid gap-4">
      <PageHeader title="ダッシュボード" />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              内部残高（全期間）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(data.internalBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">積立残高合計</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatCurrency(data.savingTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              未来日取引（件数）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {data.futureTransactionCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {formatFiscalYear(data.currentFiscalYear)} 収支サマリ
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-3">
          <p>収入: {formatCurrency(data.fiscalSummary.income)}</p>
          <p>支出: {formatCurrency(data.fiscalSummary.expense)}</p>
          <p>差分: {formatCurrency(data.fiscalSummary.balance)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>主要画面への遷移</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <Link to="/transactions" className="text-primary underline">
            取引入力と一覧へ
          </Link>
          <Link to="/categories" className="text-primary underline">
            カテゴリ管理へ
          </Link>
          <Link to="/budgets" className="text-primary underline">
            年度予算へ
          </Link>
          <Link to="/analytics" className="text-primary underline">
            分析画面へ
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
})
