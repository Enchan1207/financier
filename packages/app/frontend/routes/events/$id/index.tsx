import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@frontend/components/ui/alert-dialog'
import { Button } from '@frontend/components/ui/button'
import dayjs from '@frontend/lib/date'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import { EventEditDialog } from '../-components/event-edit-dialog'
import { EventSummaryCard } from '../-components/event-summary-card'
import { EventTransactionSection } from '../-components/event-transaction-section'
import { useEventMutations } from '../-hooks/use-event-mutations'
import { eventDetailQueryOptions } from '../-repositories/events'

const formatDateFull = (dateStr: string) => dayjs(dateStr).format('YYYY/M/D')

const EventDetailPage: React.FC = () => {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const [editOpen, setEditOpen] = useState(false)

  const {
    data: event,
    isPending,
    isError,
  } = useQuery(eventDetailQueryOptions(id))

  const { updateMutation, deleteMutation } = useEventMutations()

  if (isPending) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        読み込み中...
      </p>
    )
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/events">
            <ArrowLeftIcon />
            イベント一覧へ
          </Link>
        </Button>
        <p className="text-muted-foreground">イベントが見つかりません。</p>
      </div>
    )
  }

  const total = event.transactions.reduce((sum, tx) => sum + tx.amount, 0)

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id)
    void navigate({ to: '/events' })
  }

  return (
    <div className="max-w-2xl lg:max-w-full space-y-6">
      {/* ヘッダー */}
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/events">
            <ArrowLeftIcon />
            イベント一覧へ
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateFull(event.occurredOn)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 編集ダイアログ（UC-5.6） */}
            <EventEditDialog
              open={editOpen}
              onOpenChange={setEditOpen}
              defaultName={event.name}
              defaultDate={event.occurredOn}
              onSave={async (name, occurredOn) => {
                await updateMutation.mutateAsync({ id, name, occurredOn })
              }}
            />

            {/* transactionCount === 0 の場合のみ削除可能（UC-5.7） */}
            {event.transactions.length === 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Trash2Icon />
                    削除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      イベントを削除しますか？
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      「{event.name}」を削除します。この操作は取り消せません。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      削除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* 集計サマリー */}
      <EventSummaryCard
        total={total}
        categoryBreakdown={event.categoryBreakdown}
      />

      {/* トランザクション一覧 */}
      <EventTransactionSection eventId={id} transactions={event.transactions} />
    </div>
  )
}

export const Route = createFileRoute('/events/$id/')({
  component: EventDetailPage,
})
