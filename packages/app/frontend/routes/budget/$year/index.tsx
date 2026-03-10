import { Badge } from '@frontend/components/ui/badge'
import { Button } from '@frontend/components/ui/button'
import { createFileRoute } from '@tanstack/react-router'
import { LockIcon, PencilIcon } from 'lucide-react'
import { useState } from 'react'

import { BudgetSummaryChart } from '../-components/budget-summary-chart'
import { CategoryBudgetCard } from '../-components/category-budget-card'
import {
  expenseItems,
  expenseSummaryItems,
  incomeItems,
  incomeSummaryItems,
} from '../-lib/mock-data'
import { FiscalYearCloseDialog } from './-components/fiscal-year-close-dialog'

type FiscalYearStatus = 'active' | 'closed'

const BudgetYearPage: React.FC = () => {
  const { year } = Route.useParams()
  const [status, setStatus] = useState<FiscalYearStatus>('active')
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)

  const handleClose = async (_copyBudget: boolean): Promise<void> => {
    await new Promise<void>((resolve) => setTimeout(resolve, 800))
    setStatus('closed')
    setCloseDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-foreground">{year}年度 予算</h1>

        <div className="flex items-center gap-2">
          {status === 'active' ? (
            <>
              <Button size="sm" variant="outline">
                <PencilIcon />
                編集
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

      <BudgetSummaryChart
        incomeItems={incomeSummaryItems}
        expenseItems={expenseSummaryItems}
      />

      <CategoryBudgetCard
        incomeItems={incomeItems}
        expenseItems={expenseItems}
      />

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
