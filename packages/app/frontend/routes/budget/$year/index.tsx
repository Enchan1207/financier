import { Button } from '@frontend/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'
import { PencilIcon } from 'lucide-react'

import { BudgetSummaryChart } from '../-components/budget-summary-chart'
import { CategoryBudgetCard } from '../-components/category-budget-card'
import {
  expenseItems,
  expenseSummaryItems,
  incomeItems,
  incomeSummaryItems,
} from '../-lib/mock-data'

const BudgetYearPage: React.FC = () => {
  const { year } = Route.useParams()

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
