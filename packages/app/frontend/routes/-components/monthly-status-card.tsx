import { Badge } from '@frontend/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@frontend/components/ui/collapsible'
import { Progress } from '@frontend/components/ui/progress'
import { formatCurrency } from '@frontend/lib/format'
import type { AnnualBudget } from '@frontend/lib/types'
import { Link } from '@tanstack/react-router'
import { ArrowRight, ChevronDownIcon, TrendingDown } from 'lucide-react'
import { useState } from 'react'

export type WarningCategory = {
  categoryId: string
  categoryName: string
  actual: number
  monthly: number
  status: 'over' | 'warning'
}

type MonthlyStatusCardProps = {
  actualExpense: number
  forecastExpense: number
  monthlyBudget: number
  warningCategories: WarningCategory[]
  expenseBudgets: AnnualBudget[]
}

export const MonthlyStatusCard: React.FC<MonthlyStatusCardProps> = ({
  actualExpense,
  forecastExpense,
  monthlyBudget,
  warningCategories,
  expenseBudgets,
}) => {
  const [open, setOpen] = useState(false)

  const actualRate =
    monthlyBudget > 0 ? Math.round((actualExpense / monthlyBudget) * 100) : 0
  const forecastTotal = actualExpense + forecastExpense
  const forecastRate =
    monthlyBudget > 0 ? Math.round((forecastTotal / monthlyBudget) * 100) : 0
  const hasForecast = forecastExpense > 0
  const hasWarnings = warningCategories.length > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">今月の状況</CardTitle>
          </div>
          <Link
            to="/budget"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            詳細 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 支出実績バー */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">支出実績</span>
            <span className="tabular-nums">
              {formatCurrency(actualExpense)}
              <span className="text-xs text-muted-foreground">
                {' '}
                / {formatCurrency(monthlyBudget)}
              </span>
            </span>
          </div>
          <Progress value={Math.min(actualRate, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground">予算の {actualRate}%</p>
        </div>

        {/* 見込み */}
        {hasForecast && (
          <p className="text-xs text-muted-foreground">
            ＋今月の予定 {formatCurrency(forecastExpense)}（見込み{' '}
            {forecastRate}%）
          </p>
        )}

        {/* 警告カテゴリ */}
        {hasWarnings && (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-muted -mx-2">
              <div className="flex flex-wrap gap-1.5">
                {warningCategories.map((c) => (
                  <Badge
                    key={c.categoryId}
                    variant={c.status === 'over' ? 'destructive' : 'outline'}
                    className={`px-1.5 py-0 text-xs ${
                      c.status === 'warning'
                        ? 'border-yellow-500 text-yellow-600'
                        : ''
                    }`}
                  >
                    {c.status === 'over' ? '⚠' : '▲'} {c.categoryName}
                  </Badge>
                ))}
              </div>
              <ChevronDownIcon className="ml-2 size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 gap-y-3 pt-3 sm:grid-cols-2 sm:gap-x-6">
                {expenseBudgets.map((b) => {
                  const monthly = Math.round(b.annualBudget / 12)
                  const rate =
                    monthly > 0
                      ? Math.round((b.currentMonthActual / monthly) * 100)
                      : 0
                  const status =
                    rate >= 100 ? 'over' : rate >= 80 ? 'warning' : 'ok'
                  if (status === 'ok') return null
                  return (
                    <div key={b.categoryId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{b.categoryName}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {formatCurrency(b.currentMonthActual)}
                          <span className="text-xs">
                            {' '}
                            / {formatCurrency(monthly)}
                          </span>
                        </span>
                      </div>
                      <Progress
                        value={Math.min(rate, 100)}
                        className={`h-1.5 ${
                          status === 'over'
                            ? '[&>div]:bg-destructive'
                            : '[&>div]:bg-yellow-500'
                        }`}
                      />
                    </div>
                  )
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}
