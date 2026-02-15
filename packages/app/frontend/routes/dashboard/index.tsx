import { PageHeader } from '@frontend/components/layout/page-header'
import {
  Card,
  CardContent,
  CardDescription,
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
      <PageHeader
        title="ダッシュボード"
        description="内部残高・積立残高・年度収支の主要指標を一覧で確認できます。"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>内部残高（全期間）</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(data.internalBalance)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>積立残高合計</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(data.savingTotal)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>未来日取引（件数）</CardDescription>
            <CardTitle className="text-2xl">
              {data.futureTransactionCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {formatFiscalYear(data.currentFiscalYear)} 収支サマリ
          </CardTitle>
          <CardDescription>
            未来日取引を除いた実績のみを集計しています。
          </CardDescription>
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
          <CardDescription>
            根幹機能から順に確認しやすいよう、導線を固定しています。
          </CardDescription>
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
