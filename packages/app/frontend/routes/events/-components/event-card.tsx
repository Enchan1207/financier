import { Badge } from '@frontend/components/ui/badge'
import { Button } from '@frontend/components/ui/button'
import { Card, CardContent } from '@frontend/components/ui/card'
import dayjs from '@frontend/lib/date'
import { formatCurrency } from '@frontend/lib/mock-data'
import { Link } from '@tanstack/react-router'
import { ChevronRight, Trash2Icon } from 'lucide-react'
import type React from 'react'

export type EventSummary = {
  id: string
  name: string
  dateRange?: { start: string; end?: string }
  totalAmount: number
  transactionCount: number
}

type Props = {
  ev: EventSummary
  today: string
  onDelete: (id: string) => void
}

const formatDate = (dateStr: string) => dayjs(dateStr).format('M/D')

export const EventCard: React.FC<Props> = ({ ev, today, onDelete }) => {
  const isPast =
    ev.dateRange && (ev.dateRange.end ?? ev.dateRange.start) < today
  const isFuture = ev.dateRange?.start && ev.dateRange.start > today

  return (
    <Link to="/events/$id" params={{ id: ev.id }} className="block">
      <Card className="transition-colors hover:bg-accent">
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{ev.name}</p>
                  {ev.dateRange && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(ev.dateRange.start)}
                      {ev.dateRange.end &&
                        ` 〜 ${formatDate(ev.dateRange.end)}`}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
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
                  {/* transactionCount === 0 の場合のみ削除可能（UC-5.7） */}
                  {ev.transactionCount === 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault()
                        onDelete(ev.id)
                      }}
                    >
                      <Trash2Icon className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold tabular-nums">
                  {formatCurrency(ev.totalAmount)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {ev.transactionCount} 件
                </span>
              </div>
            </div>

            <ChevronRight className="shrink-0 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
