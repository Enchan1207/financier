import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@frontend/components/ui/collapsible'
import dayjs from '@frontend/lib/date'
import { createFileRoute } from '@tanstack/react-router'
import { ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'

import type { EventSummary } from './-components/event-card'
import { EventCard } from './-components/event-card'
import { EventCreateDialog } from './-components/event-create-dialog'

const TODAY = '2026-02-28'

// モックデータ：本番ではAPIから /events を取得する
const MOCK_EVENTS: EventSummary[] = [
  {
    id: 'ev-1',
    name: 'バレンタインイベント',
    occurredOn: '2026-02-14',
    totalAmount: 154200,
    transactionCount: 2,
  },
  {
    id: 'ev-2',
    name: '春ライブ遠征',
    occurredOn: '2026-02-20',
    totalAmount: 35700,
    transactionCount: 5,
  },
  {
    id: 'ev-3',
    name: '春グッズ',
    occurredOn: '2026-03-05',
    totalAmount: 5500,
    transactionCount: 1,
  },
  {
    id: 'ev-4',
    name: '年末飲み会',
    occurredOn: '2025-12-28',
    totalAmount: 4500,
    transactionCount: 0,
  },
]

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventSummary[]>(MOCK_EVENTS)
  const [newDialogOpen, setNewDialogOpen] = useState(false)

  const upcoming = events.filter((ev) => ev.occurredOn >= TODAY)
  const past = events.filter((ev) => ev.occurredOn < TODAY)

  const handleCreate = (name: string, occurredOn: string) => {
    // モック：実際にはAPIを呼び出してイベントを作成する（UC-5.1）
    const created: EventSummary = {
      id: `ev-${dayjs().valueOf()}`,
      name,
      occurredOn,
      totalAmount: 0,
      transactionCount: 0,
    }
    setEvents((prev) => [...prev, created])
  }

  const handleDelete = (id: string) => {
    // トランザクション0件の場合のみ削除可能（UC-5.7）
    setEvents((prev) => prev.filter((ev) => ev.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">イベント</h1>
        {/* 新規作成ダイアログ（UC-5.1） */}
        <EventCreateDialog
          open={newDialogOpen}
          onOpenChange={setNewDialogOpen}
          onCreate={handleCreate}
        />
      </div>

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
                  <EventCard key={ev.id} ev={ev} onDelete={handleDelete} />
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
                  <EventCard key={ev.id} ev={ev} onDelete={handleDelete} />
                ))}
              </div>
            </CollapsibleContent>
          </section>
        </Collapsible>
      )}
    </div>
  )
}

export const Route = createFileRoute('/events/')({
  component: EventsPage,
})
