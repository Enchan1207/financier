import { Button } from '@frontend/components/ui/button'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

import { BudgetNewFormFields } from './-components/budget-new-form'
import { useBudgetNewForm } from './-components/use-budget-new-form'

const BudgetNewPage: React.FC = () => {
  const navigate = useNavigate()
  const form = useBudgetNewForm(({ year }) => {
    // モック：実際にはAPIを呼び出して年度予算を作成する
    void navigate({ to: '/budget/$year', params: { year } })
  })

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/budget">
            <ArrowLeftIcon />
            予算一覧へ
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">年度予算作成</h1>
      </div>

      <form
        className="space-y-6"
        onSubmit={async (e) => {
          e.preventDefault()
          await form.handleSubmit()
        }}
      >
        <BudgetNewFormFields form={form} />

        <form.Subscribe
          selector={(state) => [state.values.year, state.isSubmitting]}
          children={([year, isSubmitting]) => (
            <div className="flex gap-2">
              <Button type="submit" disabled={!year || !!isSubmitting}>
                {year ? `${year}年度予算を作成` : '予算を作成'}
              </Button>
              <Button asChild variant="ghost">
                <Link to="/budget">キャンセル</Link>
              </Button>
            </div>
          )}
        />
      </form>
    </div>
  )
}

export const Route = createFileRoute('/budget/new/')({
  component: BudgetNewPage,
})
