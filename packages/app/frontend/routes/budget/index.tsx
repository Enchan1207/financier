import { Badge } from '@frontend/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import type { ChartConfig } from '@frontend/components/ui/chart'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@frontend/components/ui/chart'
import { Progress } from '@frontend/components/ui/progress'
import {
  annualBudgets,
  categories,
  formatCurrency,
  TODAY,
  transactions,
} from '@frontend/lib/mock-data'
import { createFileRoute } from '@tanstack/react-router'
import { Pie, PieChart } from 'recharts'

const FISCAL_YEAR = TODAY.slice(0, 4)

const categoryColorMap: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.id, c.color]),
)

const categoryTypeMap: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.id, c.type]),
)

// カテゴリごとの年度内支出実績をトランザクションから算出
const ytdExpenseByCategory = transactions
  .filter(
    (tx) =>
      tx.type === 'expense' &&
      tx.transactionDate <= TODAY &&
      tx.transactionDate.startsWith(FISCAL_YEAR),
  )
  .reduce<Record<string, number>>((acc, tx) => {
    acc[tx.categoryId] = (acc[tx.categoryId] ?? 0) + tx.amount
    return acc
  }, {})

// カテゴリごとの年度内収入実績をトランザクションから算出
const ytdIncomeByCategory = transactions
  .filter(
    (tx) =>
      tx.type === 'income' &&
      tx.transactionDate <= TODAY &&
      tx.transactionDate.startsWith(FISCAL_YEAR),
  )
  .reduce<Record<string, number>>((acc, tx) => {
    acc[tx.categoryId] = (acc[tx.categoryId] ?? 0) + tx.amount
    return acc
  }, {})

const incomeBudgets = annualBudgets.filter(
  (b) => categoryTypeMap[b.categoryId] === 'income',
)
const expenseBudgets = annualBudgets.filter(
  (b) => categoryTypeMap[b.categoryId] === 'expense',
)

const totalIncomeBudget = incomeBudgets.reduce(
  (sum, b) => sum + b.annualBudget,
  0,
)
const totalExpenseBudget = expenseBudgets.reduce(
  (sum, b) => sum + b.annualBudget,
  0,
)
const unallocatedBudget = totalIncomeBudget - totalExpenseBudget

const UNALLOCATED_COLOR = 'oklch(0.75 0 0)'

const incomePieConfig = incomeBudgets.reduce<ChartConfig>(
  (acc, b) => ({
    ...acc,
    [b.categoryId]: {
      label: b.categoryName,
      color: categoryColorMap[b.categoryId],
    },
  }),
  {},
)
const expensePieConfig: ChartConfig = {
  ...expenseBudgets.reduce<ChartConfig>(
    (acc, b) => ({
      ...acc,
      [b.categoryId]: {
        label: b.categoryName,
        color: categoryColorMap[b.categoryId],
      },
    }),
    {},
  ),
  ...(unallocatedBudget > 0
    ? { unallocated: { label: '未割り当て', color: UNALLOCATED_COLOR } }
    : {}),
}

const incomePieData = incomeBudgets.map((b) => ({
  name: b.categoryId,
  value: b.annualBudget,
  fill: `var(--color-${b.categoryId})`,
}))
const expensePieData = [
  ...expenseBudgets.map((b) => ({
    name: b.categoryId,
    value: b.annualBudget,
    fill: `var(--color-${b.categoryId})`,
  })),
  ...(unallocatedBudget > 0
    ? [
        {
          name: 'unallocated',
          value: unallocatedBudget,
          fill: 'var(--color-unallocated)',
        },
      ]
    : []),
]

const BudgetPage: React.FC = () => {
  const sortedExpense = expenseBudgets.slice().sort((a, b) => {
    const ytdA = ytdExpenseByCategory[a.categoryId] ?? 0
    const ytdB = ytdExpenseByCategory[b.categoryId] ?? 0
    return ytdB / b.annualBudget - ytdA / a.annualBudget
  })

  return (
    <div className="space-y-6">
      {/* 予算配分パイチャート */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">予算配分</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="flex-1 space-y-1">
              <p className="text-xs text-center font-medium text-muted-foreground">
                収入
              </p>
              <ChartContainer
                config={incomePieConfig}
                className="mx-auto aspect-square max-h-[220px]"
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" hideLabel />}
                  />
                  <Pie
                    data={incomePieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="95%"
                    startAngle={90}
                    endAngle={-270}
                  />
                </PieChart>
              </ChartContainer>
              <p className="text-2xl font-bold text-center tabular-nums">
                {formatCurrency(totalIncomeBudget)}
              </p>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-xs text-center font-medium text-muted-foreground">
                支出
              </p>
              <ChartContainer
                config={expensePieConfig}
                className="mx-auto aspect-square max-h-[220px]"
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" hideLabel />}
                  />
                  <Pie
                    data={expensePieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="95%"
                    startAngle={90}
                    endAngle={-270}
                  />
                </PieChart>
              </ChartContainer>
              <p className="text-2xl font-bold text-center tabular-nums">
                {formatCurrency(totalExpenseBudget)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* カテゴリ別バーチャート: md以上で横並び、スマホでは縦並び */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 収入カード */}
        <Card className="flex flex-col max-h-[50vh] md:max-h-[60vh]">
          <CardHeader>
            <CardTitle className="text-base">収入</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-5">
            {incomeBudgets.map((b) => {
              const ytdActual = ytdIncomeByCategory[b.categoryId] ?? 0
              const rate = Math.round((ytdActual / b.annualBudget) * 100)

              return (
                <div key={b.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {b.categoryName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(ytdActual)} /{' '}
                      {formatCurrency(b.annualBudget)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(rate, 100)}
                    className="h-2 bg-[var(--track-color)] [&>div]:bg-[var(--bar-color)]"
                    style={
                      {
                        '--bar-color': categoryColorMap[b.categoryId],
                        '--track-color': `color-mix(in srgb, ${categoryColorMap[b.categoryId]} 20%, var(--background))`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* 支出カード */}
        <Card className="flex flex-col max-h-[50vh] md:max-h-[60vh]">
          <CardHeader>
            <CardTitle className="text-base">支出</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-5">
            {sortedExpense.map((b) => {
              const ytdActual = ytdExpenseByCategory[b.categoryId] ?? 0
              const rate = Math.round((ytdActual / b.annualBudget) * 100)
              const status =
                rate >= 100 ? 'over' : rate >= 80 ? 'warning' : 'ok'

              return (
                <div key={b.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {b.categoryName}
                      </span>
                      {status === 'over' && (
                        <Badge variant="destructive" className="text-xs">
                          超過
                        </Badge>
                      )}
                      {status === 'warning' && (
                        <Badge
                          variant="outline"
                          className="text-xs border-yellow-500 text-yellow-600"
                        >
                          注意
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(ytdActual)} /{' '}
                      {formatCurrency(b.annualBudget)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(rate, 100)}
                    className={`h-2 bg-[var(--track-color)] ${
                      status === 'over'
                        ? '[&>div]:bg-destructive'
                        : status === 'warning'
                          ? '[&>div]:bg-yellow-500'
                          : '[&>div]:bg-[var(--bar-color)]'
                    }`}
                    style={
                      {
                        '--bar-color': categoryColorMap[b.categoryId],
                        '--track-color': `color-mix(in srgb, ${categoryColorMap[b.categoryId]} 20%, var(--background))`,
                      } as React.CSSProperties
                    }
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {`${rate}%`}
                  </p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/budget/')({
  component: BudgetPage,
})
