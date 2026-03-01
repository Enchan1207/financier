import { createFileRoute } from '@tanstack/react-router'

const BudgetNewPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">新規年度予算作成</h1>
      <p className="text-muted-foreground">（工事中）</p>
    </div>
  )
}

export const Route = createFileRoute('/budget/new/')({
  component: BudgetNewPage,
})
