import { createFileRoute } from '@tanstack/react-router'

const SavingNewPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">積立新規作成</h1>
      <p className="text-muted-foreground">（工事中）</p>
    </div>
  )
}

export const Route = createFileRoute('/savings/new/')({
  component: SavingNewPage,
})
