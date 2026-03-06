import { Button } from '@frontend/components/ui/button'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

const SavingDetailPage: React.FC = () => {
  const { id } = Route.useParams()

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/savings">
            <ArrowLeftIcon />
            積立一覧へ
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">積立詳細</h1>
        <p className="text-muted-foreground">{id}</p>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/savings/$id/')({
  component: SavingDetailPage,
})
