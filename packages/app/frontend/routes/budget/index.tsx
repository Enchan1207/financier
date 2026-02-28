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
import {
  annualBudgets,
  categories,
  formatCurrency,
  TODAY,
  transactions,
} from '@frontend/lib/mock-data'
import { createFileRoute } from '@tanstack/react-router'
import { Pie, PieChart } from 'recharts'

import type { BudgetItem } from './-components/category-budget-card'
import { CategoryBudgetCard } from './-components/category-budget-card'

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

  const incomeItems: BudgetItem[] = incomeBudgets.map((b) => ({
    categoryId: b.categoryId,
    categoryName: b.categoryName,
    annualBudget: b.annualBudget,
    ytdActual: ytdIncomeByCategory[b.categoryId] ?? 0,
    color: categoryColorMap[b.categoryId] ?? '',
  }))

  const expenseItems: BudgetItem[] = sortedExpense.map((b) => {
    const ytdActual = ytdExpenseByCategory[b.categoryId] ?? 0
    const rate = Math.round((ytdActual / b.annualBudget) * 100)
    const status: 'over' | 'warning' | 'ok' =
      rate >= 100 ? 'over' : rate >= 80 ? 'warning' : 'ok'
    return {
      categoryId: b.categoryId,
      categoryName: b.categoryName,
      annualBudget: b.annualBudget,
      ytdActual,
      color: categoryColorMap[b.categoryId] ?? '',
      status,
    }
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
        <CategoryBudgetCard title="収入" items={incomeItems} />
        <CategoryBudgetCard title="支出" items={expenseItems} showRate />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/budget/')({
  component: BudgetPage,
})
