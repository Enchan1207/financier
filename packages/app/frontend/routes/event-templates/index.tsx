import { Button } from '@frontend/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { match } from 'ts-pattern'

import type { BulkRegisterItem } from './-components/template-card'
import { TemplateCard } from './-components/template-card'
import type { EventTemplateSummary } from './-repositories/event-templates'
import { listEventTemplatesQueryOptions } from './-repositories/event-templates'

type TemplateListState =
  | { type: 'pending' }
  | { type: 'error' }
  | { type: 'empty' }
  | { type: 'loaded'; templates: EventTemplateSummary[] }

const buildState = (
  isPending: boolean,
  isError: boolean,
  data: EventTemplateSummary[] | undefined,
): TemplateListState => {
  if (isPending) return { type: 'pending' }
  if (isError) return { type: 'error' }
  if (!data || data.length === 0) return { type: 'empty' }
  return { type: 'loaded', templates: data }
}

const TemplateGrid: React.FC<{ templates: EventTemplateSummary[] }> = ({
  templates,
}) => (
  <div className="grid gap-4 sm:grid-cols-2">
    {templates.map((tmpl) => {
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
)

const EventTemplatesPage: React.FC = () => {
  const { data, isPending, isError } = useQuery(
    listEventTemplatesQueryOptions(),
  )

  const state = buildState(isPending, isError, data)

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

      {match(state)
        .with({ type: 'pending' }, () => (
          <p className="py-8 text-center text-sm text-muted-foreground">
            読み込み中...
          </p>
        ))
        .with({ type: 'error' }, () => (
          <p className="py-8 text-center text-sm text-destructive">
            テンプレートの取得に失敗しました
          </p>
        ))
        .with({ type: 'empty' }, () => (
          <p className="py-8 text-center text-sm text-muted-foreground">
            テンプレートがありません
          </p>
        ))
        .with({ type: 'loaded' }, ({ templates }) => (
          <TemplateGrid templates={templates} />
        ))
        .exhaustive()}
    </div>
  )
}

export const Route = createFileRoute('/event-templates/')({
  component: EventTemplatesPage,
})
