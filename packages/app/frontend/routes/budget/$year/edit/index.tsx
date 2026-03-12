import { Button } from '@frontend/components/ui/button'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'
import { useState } from 'react'

import {
  expenseItems as mockExpenseItems,
  incomeItems as mockIncomeItems,
} from '../../-lib/mock-data'
import { BudgetNewFormFields } from '../../new/-components/budget-new-form'
import type { BudgetEntry } from '../../new/-components/use-budget-new-form'
import { useBudgetNewForm } from '../../new/-components/use-budget-new-form'

const toEntry = (item: {
  categoryId: string
  categoryName: string
  annualBudget: number
}): BudgetEntry => ({
  categoryId: item.categoryId,
  categoryName: item.categoryName,
  annualBudget: String(item.annualBudget),
})

const BudgetEditPage: React.FC = () => {
  const { year } = Route.useParams()
  const navigate = useNavigate()
  const [balanceError, setBalanceError] = useState(false)

  const form = useBudgetNewForm(
    async ({ incomeEntries, expenseEntries }) => {
      const totalIncome = incomeEntries.reduce(
        (s, e) => s + parseInt(e.annualBudget || '0', 10),
        0,
      )
      const totalExpense = expenseEntries.reduce(
        (s, e) => s + parseInt(e.annualBudget || '0', 10),
        0,
      )
      if (totalExpense > totalIncome) {
        setBalanceError(true)
        return
      }
      setBalanceError(false)
      // モック：実際には API を呼び出して保存する
      await new Promise((resolve) => setTimeout(resolve, 800))
      void navigate({ to: '/budget/$year', params: { year } })
    },
    {
      year,
      incomeEntries: (
        mockIncomeItems as {
          categoryId: string
          categoryName: string
          annualBudget: number
        }[]
      ).map(toEntry),
      expenseEntries: (
        mockExpenseItems as {
          categoryId: string
          categoryName: string
          annualBudget: number
        }[]
      ).map(toEntry),
    },
  )

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/budget/$year" params={{ year }}>
            <ArrowLeftIcon />
            予算詳細へ
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {year}年度 予算を編集
        </h1>
      </div>

      <form
        className="space-y-6"
        onSubmit={async (e) => {
          e.preventDefault()
          await form.handleSubmit()
        }}
      >
        <BudgetNewFormFields
          form={form}
          showYearField={false}
          showCopyButton={false}
        />

        {balanceError && (
          <p className="text-sm text-destructive">
            支出予算合計が収入予算合計を超えているため保存できません。
          </p>
        )}

        <form.Subscribe
          selector={(state) => state.isSubmitting}
          children={(isSubmitting) => (
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                <Loader2Icon
                  className={`animate-spin ${isSubmitting ? '' : 'hidden'}`}
                />
                変更を保存
              </Button>
              <Button asChild variant="ghost">
                <Link to="/budget/$year" params={{ year }}>
                  キャンセル
                </Link>
              </Button>
            </div>
          )}
        />
      </form>
    </div>
  )
}

export const Route = createFileRoute('/budget/$year/edit/')({
  component: BudgetEditPage,
})
