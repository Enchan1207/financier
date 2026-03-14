import { Badge } from '@frontend/components/ui/badge'
import { Button } from '@frontend/components/ui/button'
import { formatCurrency } from '@frontend/lib/format'
import { createFileRoute, Link } from '@tanstack/react-router'
import { LockIcon, PencilIcon, TriangleAlertIcon } from 'lucide-react'
import { useState } from 'react'

import { BudgetInputDialog } from '../-components/budget-input-dialog'
import type { SummaryBarItem } from '../-components/budget-summary-chart'
import { BudgetSummaryChart } from '../-components/budget-summary-chart'
import type { BudgetItem } from '../-components/category-budget-card'
import { CategoryBudgetCard } from '../-components/category-budget-card'
import {
  expenseItems as mockExpenseItems,
  incomeItems as mockIncomeItems,
} from '../-lib/mock-data'
import { FiscalYearCloseDialog } from './-components/fiscal-year-close-dialog'

type FiscalYearStatus = 'active' | 'closed'

const calcStatus = (
  ytdActual: number,
  annualBudget: number,
): 'over' | 'warning' | 'ok' => {
  const rate = ytdActual / annualBudget
  return rate >= 1.0 ? 'over' : rate >= 0.8 ? 'warning' : 'ok'
}

const UNALLOCATED_COLOR = 'var(--border)'

const BudgetYearPage: React.FC = () => {
  const { year } = Route.useParams()
  const [status, setStatus] = useState<FiscalYearStatus>('active')
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [incomeItems, setIncomeItems] = useState<BudgetItem[]>(mockIncomeItems)
  const [expenseItems, setExpenseItems] =
    useState<BudgetItem[]>(mockExpenseItems)
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null)

  const totalIncomeBudget = incomeItems.reduce((s, i) => s + i.annualBudget, 0)
  const totalExpenseBudget = expenseItems.reduce(
    (s, i) => s + i.annualBudget,
    0,
  )
  const isDeficit = totalExpenseBudget > totalIncomeBudget
  const unallocated = totalIncomeBudget - totalExpenseBudget

  const incomeSummaryItems: SummaryBarItem[] = incomeItems.map((item) => ({
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    amount: item.annualBudget,
    color: `var(--category-${item.color})`,
  }))

  const expenseSummaryItems: SummaryBarItem[] = [
    ...expenseItems.map((item) => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      amount: item.annualBudget,
      color: `var(--category-${item.color})`,
    })),
    ...(unallocated > 0
      ? [
          {
            categoryId: 'unallocated',
            categoryName: '未割り当て',
            amount: unallocated,
            color: UNALLOCATED_COLOR,
            labelColor: 'var(--muted-foreground)',
          },
        ]
      : []),
  ]

  const handleClose = async (_copyBudget: boolean): Promise<void> => {
    await new Promise<void>((resolve) => setTimeout(resolve, 800))
    setStatus('closed')
    setCloseDialogOpen(false)
  }

  const checkBalance = (newAnnualBudget: number): boolean => {
    if (!editingItem) return false
    const isIncome = incomeItems.some(
      (i) => i.categoryId === editingItem.categoryId,
    )
    const newTotalIncome = isIncome
      ? totalIncomeBudget - editingItem.annualBudget + newAnnualBudget
      : totalIncomeBudget
    const newTotalExpense = isIncome
      ? totalExpenseBudget
      : totalExpenseBudget - editingItem.annualBudget + newAnnualBudget
    return newTotalExpense > newTotalIncome
  }

  const handleSaveItem = async (updated: BudgetItem): Promise<void> => {
    await new Promise<void>((resolve) => setTimeout(resolve, 500))
    const updateList = (items: BudgetItem[]) =>
      items.map((i) =>
        i.categoryId === updated.categoryId
          ? {
              ...updated,
              status: calcStatus(updated.ytdActual, updated.annualBudget),
            }
          : i,
      )
    setIncomeItems(updateList)
    setExpenseItems(updateList)
    setEditingItem(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-foreground">{year}年度 予算</h1>

        <div className="flex items-center gap-2">
          {status === 'active' ? (
            <>
              <Button asChild size="sm" variant="outline">
                <Link to="/budget/$year/edit" params={{ year }}>
                  <PencilIcon />
                  編集
                </Link>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setCloseDialogOpen(true)
                }}
              >
                <LockIcon />
                年度を締める
              </Button>
            </>
          ) : (
            <Badge variant="secondary">締め済み</Badge>
          )}
        </div>
      </div>

      {isDeficit && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400">
          <TriangleAlertIcon className="size-4 shrink-0" />
          <span>
            支出予算合計（{formatCurrency(totalExpenseBudget)}）が収入予算合計（
            {formatCurrency(totalIncomeBudget)}）を超えています。
          </span>
        </div>
      )}

      <BudgetSummaryChart
        incomeItems={incomeSummaryItems}
        expenseItems={expenseSummaryItems}
      />

      <CategoryBudgetCard
        incomeItems={incomeItems}
        expenseItems={expenseItems}
        onEditItem={status === 'active' ? setEditingItem : undefined}
      />

      {editingItem && (
        <BudgetInputDialog
          key={editingItem.categoryId}
          item={editingItem}
          open={true}
          onOpenChange={(v) => {
            if (!v) setEditingItem(null)
          }}
          onSave={handleSaveItem}
          checkBalance={checkBalance}
        />
      )}

      <FiscalYearCloseDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        year={year}
        onConfirm={handleClose}
      />
    </div>
  )
}

export const Route = createFileRoute('/budget/$year/')({
  component: BudgetYearPage,
})
