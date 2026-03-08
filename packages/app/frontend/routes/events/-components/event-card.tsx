import { Card, CardContent } from '@frontend/components/ui/card'
import dayjs from '@frontend/lib/date'
import { formatCurrency } from '@frontend/lib/format'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import type React from 'react'

export type EventSummary = {
  id: string
  name: string
  occurredOn: string
  totalAmount: number
  transactionCount: number
}

type Props = {
  ev: EventSummary
}

const formatDate = (dateStr: string) => dayjs(dateStr).format('YYYY/M/D')

export const EventCard: React.FC<Props> = ({ ev }) => {
  return (
    <Link to="/events/$id" params={{ id: ev.id }} className="block">
      <Card className="transition-colors hover:bg-accent">
        <CardContent className="pl-6 pr-1">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex flex-1 items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{ev.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(ev.occurredOn)}
                </p>
              </div>

              <div className="min-w-0 text-right flex flex-col">
                <p className="text-lg font-bold tabular-nums truncate">
                  {formatCurrency(ev.totalAmount)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                  {ev.transactionCount}&nbsp;件
                </p>
              </div>
            </div>
            <ChevronRight className="shrink-0 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
