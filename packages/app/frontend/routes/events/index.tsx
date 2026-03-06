import { Badge } from '@frontend/components/ui/badge'
import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog'
import { Input } from '@frontend/components/ui/input'
import { Label } from '@frontend/components/ui/label'
import dayjs from '@frontend/lib/date'
import { createFileRoute, Link } from '@tanstack/react-router'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

const TODAY = '2026-02-28'

type EventSummary = {
  id: string
  name: string
  dateRange?: { start: string; end?: string }
  totalAmount: number
  transactionCount: number
}

// モックデータ：本番ではAPIから /events を取得する
const MOCK_EVENTS: EventSummary[] = [
  {
    id: 'ev-1',
    name: 'バレンタインイベント',
    dateRange: { start: '2026-02-14' },
    totalAmount: 154200,
    transactionCount: 2,
  },
  {
    id: 'ev-2',
    name: '春ライブ遠征',
    dateRange: { start: '2026-02-20', end: '2026-03-21' },
    totalAmount: 35700,
    transactionCount: 5,
  },
  {
    id: 'ev-3',
    name: '春グッズ',
    dateRange: { start: '2026-03-05' },
    totalAmount: 5500,
    transactionCount: 1,
  },
  {
    id: 'ev-4',
    name: '年末飲み会',
    dateRange: { start: '2025-12-28' },
    totalAmount: 4500,
    transactionCount: 0,
  },
]

const formatCurrency = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`
const formatDate = (dateStr: string) => dayjs(dateStr).format('M/D')

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventSummary[]>(MOCK_EVENTS)
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')

  const upcoming = events.filter(
    (ev) => !ev.dateRange || (ev.dateRange.end ?? ev.dateRange.start) >= TODAY,
  )
  const past = events.filter(
    (ev) => ev.dateRange && (ev.dateRange.end ?? ev.dateRange.start) < TODAY,
  )

  const handleCreate = () => {
    if (!formName.trim()) return
    // モック：実際にはAPIを呼び出してイベントを作成する（UC-5.1）
    const created: EventSummary = {
      id: `ev-${dayjs().valueOf()}`,
      name: formName.trim(),
      dateRange: formStart
        ? { start: formStart, end: formEnd || undefined }
        : undefined,
      totalAmount: 0,
      transactionCount: 0,
    }
    setEvents((prev) => [...prev, created])
    setFormName('')
    setFormStart('')
    setFormEnd('')
    setNewDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    // トランザクション0件の場合のみ削除可能（UC-5.7）
    setEvents((prev) => prev.filter((ev) => ev.id !== id))
  }

  const EventCard = ({ ev }: { ev: EventSummary }) => {
    const isPast =
      ev.dateRange && (ev.dateRange.end ?? ev.dateRange.start) < TODAY
    const isFuture = ev.dateRange?.start && ev.dateRange.start > TODAY

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">{ev.name}</CardTitle>
              {ev.dateRange && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatDate(ev.dateRange.start)}
                  {ev.dateRange.end && ` 〜 ${formatDate(ev.dateRange.end)}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isFuture && (
                <Badge variant="outline" className="text-xs">
                  予定
                </Badge>
              )}
              {isPast && (
                <Badge variant="secondary" className="text-xs">
                  終了
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-2xl font-bold">
              {formatCurrency(ev.totalAmount)}
            </p>
            <p className="text-xs text-muted-foreground">
              {ev.transactionCount} 件のトランザクション
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/events/$id" params={{ id: ev.id }}>
                詳細を見る
              </Link>
            </Button>
            {/* transactionCount === 0 の場合のみ削除可能（UC-5.7） */}
            {ev.transactionCount === 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  handleDelete(ev.id)
                }}
              >
                <Trash2Icon className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">イベント</h1>
        {/* 新規作成ダイアログ（UC-5.1） */}
        <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon />
              新規作成
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>イベントを新規作成</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ev-name">イベント名 *</Label>
                <Input
                  id="ev-name"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value)
                  }}
                  placeholder="例：春ライブ遠征"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-start">開始日</Label>
                <Input
                  id="ev-start"
                  type="date"
                  value={formStart}
                  onChange={(e) => {
                    setFormStart(e.target.value)
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ev-end">終了日</Label>
                <Input
                  id="ev-end"
                  type="date"
                  value={formEnd}
                  onChange={(e) => {
                    setFormEnd(e.target.value)
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!formName.trim()}>
                作成
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            進行中 / 予定
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((ev) => (
              <EventCard key={ev.id} ev={ev} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">過去</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {past.map((ev) => (
              <EventCard key={ev.id} ev={ev} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export const Route = createFileRoute('/events/')({
  component: EventsPage,
})
