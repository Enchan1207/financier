import { Button } from '@frontend/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'

import type { BulkRegisterItem } from './-components/template-card'
import { TemplateCard } from './-components/template-card'
import { listEventTemplatesQueryOptions } from './-repositories/event-templates'

const EventTemplatesPage: React.FC = () => {
  const { data, isPending, isError } = useQuery(
    listEventTemplatesQueryOptions(),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">テンプレート</h1>
        <Button asChild size="sm">
          <Link to="/event-templates/new">
            <PlusIcon />
            新規作成
          </Link>
        </Button>
      </div>

      {isPending ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          読み込み中...
        </p>
      ) : isError ? (
        <p className="py-8 text-center text-sm text-destructive">
          テンプレートの取得に失敗しました
        </p>
      ) : data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          テンプレートがありません
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((tmpl) => {
            const items: BulkRegisterItem[] = tmpl.items.map((item, index) => ({
              id: `${tmpl.id}-${index}`,
              categoryName: item.categoryName,
              name: item.name,
              defaultAmount: item.defaultAmount,
              type: item.type,
            }))
            return (
              <TemplateCard
                key={tmpl.id}
                id={tmpl.id}
                name={tmpl.name}
                items={items}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/event-templates/')({
  component: EventTemplatesPage,
})
