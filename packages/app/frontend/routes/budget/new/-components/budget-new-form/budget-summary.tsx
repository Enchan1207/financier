import { Separator } from '@frontend/components/ui/separator'

import type { SummaryBarItem } from '../../../-components/budget-summary-chart'
import { BudgetSummaryBar } from '../../../-components/budget-summary-chart'
import type { FormInstance } from '../use-budget-new-form'

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]
const PADDING_COLOR = 'var(--border)'

export const BudgetSummary: React.FC<{ form: FormInstance }> = ({ form }) => (
  <form.Subscribe
    selector={(state) => ({
      incomeEntries: state.values.incomeEntries,
      expenseEntries: state.values.expenseEntries,
    })}
    children={({ incomeEntries, expenseEntries }) => {
      const toBarItems = (entries: typeof incomeEntries): SummaryBarItem[] =>
        entries
          .filter((e) => parseInt(e.annualBudget, 10) > 0)
          .map((e, i) => ({
            categoryId: e.categoryId,
            categoryName: e.categoryName,
            amount: parseInt(e.annualBudget, 10),
            color: CHART_COLORS[i % CHART_COLORS.length] ?? 'var(--chart-1)',
          }))

      const baseIncomeItems = toBarItems(incomeEntries)
      const baseExpenseItems = toBarItems(expenseEntries)
      const incomeTotal = baseIncomeItems.reduce((sum, e) => sum + e.amount, 0)
      const expenseTotal = baseExpenseItems.reduce(
        (sum, e) => sum + e.amount,
        0,
      )
      const balance = incomeTotal - expenseTotal
      const isDeficit = balance < 0

      // 収支が一致するようパディングを追加して両バーの軸を揃える
      const incomeItems: SummaryBarItem[] = isDeficit
        ? [
            ...baseIncomeItems,
            {
              categoryId: 'shortfall',
              categoryName: '不足分',
              amount: -balance,
              color: PADDING_COLOR,
              labelColor: 'var(--muted-foreground)',
            },
          ]
        : baseIncomeItems
      const expenseItems: SummaryBarItem[] =
        !isDeficit && balance > 0
          ? [
              ...baseExpenseItems,
              {
                categoryId: 'unallocated',
                categoryName: '未割り当て',
                amount: balance,
                color: PADDING_COLOR,
                labelColor: 'var(--muted-foreground)',
              },
            ]
          : baseExpenseItems

      const hasData = baseIncomeItems.length > 0 || baseExpenseItems.length > 0

      return (
        <div className="rounded-lg border p-4 space-y-4">
          <h2 className="text-sm font-semibold">収支サマリ</h2>

          {hasData && (
            <div className="space-y-3">
              <BudgetSummaryBar sectionLabel="収入" items={incomeItems} />
              <BudgetSummaryBar sectionLabel="支出" items={expenseItems} />
            </div>
          )}

          <div className="space-y-1 text-sm">
            <Separator />
            <div className="flex justify-between font-medium">
              <span>収支差分</span>
              <span
                className={`tabular-nums ${isDeficit ? 'text-destructive' : ''}`}
              >
                {isDeficit ? '−' : '+'}¥
                {Math.abs(balance).toLocaleString('ja-JP')}
              </span>
            </div>
          </div>

          {isDeficit && (
            <p className="text-xs text-destructive">
              支出合計が収入合計を超えています。予算配分を見直してください。
            </p>
          )}
        </div>
      )
    }}
  />
)
