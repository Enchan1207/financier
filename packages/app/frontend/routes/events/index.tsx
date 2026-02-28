import { Badge } from '@frontend/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@frontend/components/ui/table'
import { events, formatCurrency, formatDate, TODAY, transactions } from '@frontend/lib/mock-data'
import { createFileRoute } from '@tanstack/react-router'

const EventsPage: React.FC = () => {
  const upcoming = events.filter(
    (ev) => !ev.dateRange || (ev.dateRange.end ?? ev.dateRange.start) >= TODAY,
  )
  const past = events.filter(
    (ev) => ev.dateRange && (ev.dateRange.end ?? ev.dateRange.start) < TODAY,
  )

  const getEventTransactions = (eventId: string) =>
    transactions.filter((tx) => tx.eventId === eventId)

  const EventCard = ({ ev }: { ev: (typeof events)[0] }) => {
    const txs = getEventTransactions(ev.id)
    const isPast = ev.dateRange && (ev.dateRange.end ?? ev.dateRange.start) < TODAY
    const hasFuture = txs.some((tx) => tx.transactionDate > TODAY)

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
              {hasFuture && <Badge variant="outline" className="text-xs">予定あり</Badge>}
              {isPast && <Badge variant="secondary" className="text-xs">終了</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-2xl font-bold">{formatCurrency(ev.totalAmount)}</p>
          {txs.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 text-xs">日付</TableHead>
                  <TableHead className="h-8 text-xs">内容</TableHead>
                  <TableHead className="h-8 text-right text-xs">金額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txs.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className={tx.transactionDate > TODAY ? 'text-muted-foreground' : ''}
                  >
                    <TableCell className="py-1.5 text-xs font-mono">
                      {formatDate(tx.transactionDate)}
                      {tx.transactionDate > TODAY && ' (予定)'}
                    </TableCell>
                    <TableCell className="py-1.5 text-xs">{tx.name}</TableCell>
                    <TableCell className="py-1.5 text-right text-xs font-mono">
                      -{formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">イベント</h1>

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">進行中 / 予定</h2>
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
