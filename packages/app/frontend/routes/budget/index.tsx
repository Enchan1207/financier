import { Badge } from '@frontend/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card'
import { Progress } from '@frontend/components/ui/progress'
import { formatCurrency, monthlyBudgets } from '@frontend/lib/mock-data'
import { createFileRoute } from '@tanstack/react-router'

const BudgetPage: React.FC = () => {
  const totalBudget = monthlyBudgets.reduce((s, b) => s + b.monthlyBudget, 0)
  const totalActual = monthlyBudgets.reduce((s, b) => s + b.actualAmount, 0)
  const totalRate = Math.round((totalActual / totalBudget) * 100)

  const sorted = [...monthlyBudgets].sort((a, b) => {
    const rateA = a.actualAmount / a.monthlyBudget
    const rateB = b.actualAmount / b.monthlyBudget
    return rateB - rateA
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">予算</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">今月の合計</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold">{formatCurrency(totalActual)}</span>
            <span className="text-muted-foreground">/ {formatCurrency(totalBudget)}</span>
          </div>
          <Progress value={totalRate} className="h-2" />
          <p className="text-sm text-muted-foreground">
            残り {formatCurrency(totalBudget - totalActual)}（{100 - totalRate}%）
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">カテゴリ別</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {sorted.map((b) => {
            const rate = Math.round((b.actualAmount / b.monthlyBudget) * 100)
            const remaining = b.monthlyBudget - b.actualAmount
            const status =
              rate >= 100 ? 'over' : rate >= 80 ? 'warning' : 'ok'

            return (
              <div key={b.categoryId} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{b.categoryName}</span>
                    {status === 'over' && (
                      <Badge variant="destructive" className="text-xs">超過</Badge>
                    )}
                    {status === 'warning' && (
                      <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">注意</Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(b.actualAmount)} / {formatCurrency(b.monthlyBudget)}
                  </span>
                </div>
                <Progress
                  value={Math.min(rate, 100)}
                  className={`h-2 ${
                    status === 'over'
                      ? '[&>div]:bg-destructive'
                      : status === 'warning'
                        ? '[&>div]:bg-yellow-500'
                        : ''
                  }`}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {remaining >= 0 ? `残り ${formatCurrency(remaining)}` : `${formatCurrency(-remaining)} 超過`}
                </p>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/budget/')({
  component: BudgetPage,
})
