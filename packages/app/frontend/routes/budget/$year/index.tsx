import { Button } from '@frontend/components/ui/button'
import {
  annualBudgets,
  categories,
  TODAY,
  transactions,
} from '@frontend/lib/mock-data'
import { createFileRoute } from '@tanstack/react-router'
import { PencilIcon } from 'lucide-react'

import type { SummaryBarItem } from '../-components/budget-summary-chart'
import { BudgetSummaryChart } from '../-components/budget-summary-chart'
import type { BudgetItem } from '../-components/category-budget-card'
import { CategoryBudgetCard } from '../-components/category-budget-card'

const categoryColorMap: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.id, c.color]),
)

const categoryTypeMap: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.id, c.type]),
)

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

const UNALLOCATED_COLOR = 'var(--border)'

const incomeSummaryItems: SummaryBarItem[] = incomeBudgets.map((b) => ({
  categoryId: b.categoryId,
  categoryName: b.categoryName,
  amount: b.annualBudget,
  color: categoryColorMap[b.categoryId] ?? '',
}))

const expenseSummaryItems: SummaryBarItem[] = [
  ...expenseBudgets.map((b) => ({
    categoryId: b.categoryId,
    categoryName: b.categoryName,
    amount: b.annualBudget,
    color: categoryColorMap[b.categoryId] ?? '',
  })),
  ...(unallocatedBudget > 0
    ? [
        {
          categoryId: 'unallocated',
          categoryName: '未割り当て',
          amount: unallocatedBudget,
          color: UNALLOCATED_COLOR,
          labelColor: 'var(--muted-foreground)',
        },
      ]
    : []),
]

const BudgetYearPage: React.FC = () => {
  const { year } = Route.useParams()
  const ytdExpenseByCategory = transactions
    .filter(
      (tx) =>
        tx.type === 'expense' &&
        tx.transactionDate <= TODAY &&
        tx.transactionDate.startsWith(year),
    )
    .reduce<Record<string, number>>((acc, tx) => {
      acc[tx.categoryId] = (acc[tx.categoryId] ?? 0) + tx.amount
      return acc
    }, {})

  const ytdIncomeByCategory = transactions
    .filter(
      (tx) =>
        tx.type === 'income' &&
        tx.transactionDate <= TODAY &&
        tx.transactionDate.startsWith(year),
    )
    .reduce<Record<string, number>>((acc, tx) => {
      acc[tx.categoryId] = (acc[tx.categoryId] ?? 0) + tx.amount
      return acc
    }, {})

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
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-foreground">{year}年度 予算</h1>

        <Button size="sm">
          <PencilIcon />
          編集
        </Button>
      </div>

      <BudgetSummaryChart
        incomeItems={incomeSummaryItems}
        expenseItems={expenseSummaryItems}
      />

      <CategoryBudgetCard
        incomeItems={incomeItems}
        expenseItems={expenseItems}
      />
    </div>
  )
}

export const Route = createFileRoute('/budget/$year/')({
  component: BudgetYearPage,
})
