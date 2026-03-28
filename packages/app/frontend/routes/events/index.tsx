import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@frontend/components/ui/collapsible'
import dayjs from '@frontend/lib/date'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'

import type { EventSummary } from './-components/event-card'
import { EventCard } from './-components/event-card'
import { EventCreateDialog } from './-components/event-create-dialog'
import { useEventMutations } from './-hooks/use-event-mutations'
import { listEventsQueryOptions } from './-repositories/events'

const TODAY = dayjs().format('YYYY-MM-DD')

const EventsPage: React.FC = () => {
  const [newDialogOpen, setNewDialogOpen] = useState(false)

  const {
    data: eventsData,
    isPending,
    isError,
  } = useQuery(listEventsQueryOptions())
  const { createMutation } = useEventMutations()

  const events: EventSummary[] = (eventsData ?? []).map((ev) => ({
    id: ev.id,
    name: ev.name,
    occurredOn: ev.occurredOn,
    totalAmount: ev.totalAmount,
    transactionCount: ev.transactionCount,
  }))

  const upcoming = events.filter((ev) => ev.occurredOn >= TODAY)
  const past = events.filter((ev) => ev.occurredOn < TODAY)

  const handleCreate = async (
    name: string,
    occurredOn: string,
  ): Promise<void> => {
    await createMutation.mutateAsync({ name, occurredOn })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">イベント</h1>
        <EventCreateDialog
          open={newDialogOpen}
          onOpenChange={setNewDialogOpen}
          onCreate={handleCreate}
        />
      </div>

      {isPending ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          読み込み中...
        </p>
      ) : isError ? (
        <p className="py-8 text-center text-sm text-destructive">
          イベントの取得に失敗しました
        </p>
      ) : (
        <>
          {upcoming.length > 0 && (
            <Collapsible defaultOpen>
              <section className="space-y-3">
                <CollapsibleTrigger className="group flex w-[calc(100%+1rem)] items-center justify-between rounded-md px-2 py-1 hover:bg-muted">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    進行中 / 予定
                  </h2>
                  <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {upcoming.map((ev) => (
                      <EventCard key={ev.id} ev={ev} />
                    ))}
                  </div>
                </CollapsibleContent>
              </section>
            </Collapsible>
          )}

          {past.length > 0 && (
            <Collapsible defaultOpen>
              <section className="space-y-3">
                <CollapsibleTrigger className="group flex w-[calc(100%+1rem)] items-center justify-between rounded-md px-2 py-1 hover:bg-muted">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    過去
                  </h2>
                  <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {past.map((ev) => (
                      <EventCard key={ev.id} ev={ev} />
                    ))}
                  </div>
                </CollapsibleContent>
              </section>
            </Collapsible>
          )}
        </>
      )}
    </div>
  )
}

export const Route = createFileRoute('/events/')({
  component: EventsPage,
})
