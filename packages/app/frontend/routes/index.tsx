import { AddTransactionDialog } from '@frontend/components/transaction/add-transaction-dialog'
import { Button } from '@frontend/components/ui/button'
import { TODAY } from '@frontend/lib/today'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { BalanceCard } from './-components/balance-card'
import type { WarningCategory } from './-components/monthly-status-card'
import { MonthlyStatusCard } from './-components/monthly-status-card'
import { RecentTransactionsCard } from './-components/recent-transactions-card'
import {
  annualBudgets,
  INTERNAL_BALANCE,
  savings,
  transactions,
} from './-lib/mock-data'

const thisMonth = TODAY.slice(0, 7)

const calcDashboardData = () => {
  const savingsTotal = savings.reduce((s, sv) => s + sv.balance, 0)
  const freeBalance = INTERNAL_BALANCE - savingsTotal

  const actualExpense = transactions
    .filter(
      (tx) =>
        tx.type === 'expense' &&
        tx.transactionDate <= TODAY &&
        tx.transactionDate.startsWith(thisMonth),
    )
    .reduce((s, tx) => s + tx.amount, 0)

  const forecastExpense = transactions
    .filter(
      (tx) =>
        tx.type === 'expense' &&
        tx.transactionDate > TODAY &&
        tx.transactionDate.startsWith(thisMonth),
    )
    .reduce((s, tx) => s + tx.amount, 0)

  const expenseBudgets = annualBudgets.filter(
    (b) => b.categoryType === 'expense',
  )

  const monthlyBudget = expenseBudgets.reduce(
    (s, b) => s + Math.round(b.annualBudget / 12),
    0,
  )

  const warningCategories: WarningCategory[] = expenseBudgets
    .flatMap((b) => {
      const monthly = Math.round(b.annualBudget / 12)
      const rate = monthly > 0 ? b.currentMonthActual / monthly : 0
      const status: 'over' | 'warning' | null =
        rate >= 1.0 ? 'over' : rate >= 0.8 ? 'warning' : null
      if (!status) return []
      return [
        {
          categoryId: b.categoryId,
          categoryName: b.categoryName,
          actual: b.currentMonthActual,
          monthly,
          status,
        },
      ]
    })
    .sort((a, b) => b.actual / b.monthly - a.actual / a.monthly)

  const recentTransactions = transactions
    .filter((tx) => tx.transactionDate <= TODAY)
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
    .slice(0, 5)

  return {
    savingsTotal,
    freeBalance,
    actualExpense,
    forecastExpense,
    monthlyBudget,
    expenseBudgets,
    warningCategories,
    recentTransactions,
  }
}

const HomePage: React.FC = () => {
  const {
    savingsTotal,
    freeBalance,
    actualExpense,
    forecastExpense,
    monthlyBudget,
    expenseBudgets,
    warningCategories,
    recentTransactions,
  } = calcDashboardData()

  return (
    <div className="space-y-6">
      <BalanceCard freeBalance={freeBalance} savingsTotal={savingsTotal} />
      <MonthlyStatusCard
        actualExpense={actualExpense}
        forecastExpense={forecastExpense}
        monthlyBudget={monthlyBudget}
        warningCategories={warningCategories}
        expenseBudgets={expenseBudgets}
      />
      <RecentTransactionsCard transactions={recentTransactions} />

      {/* モバイル用 FAB */}
      <AddTransactionDialog
        trigger={
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg sm:hidden"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        }
      />
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage,
})
