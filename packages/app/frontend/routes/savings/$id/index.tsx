import { createFileRoute } from '@tanstack/react-router'

const SavingDetailPage: React.FC = () => {
  const { id } = Route.useParams()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">積立詳細</h1>
      <p className="text-muted-foreground">{id}</p>
    </div>
  )
}

export const Route = createFileRoute('/savings/$id/')({
  component: SavingDetailPage,
})
