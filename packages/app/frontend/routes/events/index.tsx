import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@frontend/components/ui/alert'
import { Badge } from '@frontend/components/ui/badge'
import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog'
import { Input } from '@frontend/components/ui/input'
import { Label } from '@frontend/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@frontend/components/ui/table'
import {
  useEventActions,
  useEventListQuery,
} from '@frontend/hooks/use-mock-finance-store'
import { formatCurrency, formatDate } from '@frontend/lib/financier-format'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

const EventsPage = () => {
  const { data: events, templates } = useEventListQuery()
  const { createEvent } = useEventActions()

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState<{
    variant: 'default' | 'destructive'
    title: string
    description?: string
  } | null>(null)

  const handleCreate = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = createEvent({
      name,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })

    if (!result.ok) {
      setFeedback({
        variant: 'destructive',
        title: 'イベント作成に失敗しました',
        description: result.message,
      })

      return
    }

    setFeedback({
      variant: 'default',
      title: 'イベントを作成しました',
    })
    setName('')
    setStartDate('')
    setEndDate('')
    setIsCreateDialogOpen(false)
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>イベント（Event）</CardTitle>
          <CardDescription>
            UC-5 系のモックです。イベント作成とイベント単位集計を確認できます。
          </CardDescription>
        </CardHeader>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Card>
          <CardHeader>
            <CardTitle>イベントを作成</CardTitle>
            <CardDescription>作成はダイアログで行います。</CardDescription>
            <CardAction>
              <DialogTrigger asChild>
                <Button>イベントを追加</Button>
              </DialogTrigger>
            </CardAction>
          </CardHeader>
        </Card>

        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>イベントを作成</DialogTitle>
            <DialogDescription>
              期間は任意です。未設定の場合は後から紐付けのみ行えます。
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleCreate}>
            <div className="grid gap-2">
              <Label htmlFor="event-name">イベント名</Label>
              <Input
                id="event-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                }}
                placeholder="イベント名"
                required
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="event-start-date">開始日（任意）</Label>
                <Input
                  id="event-start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value)
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-end-date">終了日（任意）</Label>
                <Input
                  id="event-end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => {
                    setEndDate(event.target.value)
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  キャンセル
                </Button>
              </DialogClose>
              <Button type="submit">作成する</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {feedback !== null && (
        <Alert variant={feedback.variant}>
          <AlertTitle>{feedback.title}</AlertTitle>
          <AlertDescription>{feedback.description}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>イベント集計一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>イベント名</TableHead>
                <TableHead>期間</TableHead>
                <TableHead className="text-right">取引件数</TableHead>
                <TableHead className="text-right">総額</TableHead>
                <TableHead>カテゴリ別</TableHead>
                <TableHead>年度別</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.name}</TableCell>
                  <TableCell>
                    {event.startDate === undefined
                      ? '未設定'
                      : `${formatDate(event.startDate)} - ${
                          event.endDate === undefined
                            ? '未設定'
                            : formatDate(event.endDate)
                        }`}
                  </TableCell>
                  <TableCell className="text-right">
                    {event.transactionCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(event.totalAmount)}
                  </TableCell>
                  <TableCell className="space-y-1">
                    {Object.entries(event.byCategory).map(
                      ([category, amount]) => (
                        <p key={category} className="text-xs">
                          {category}: {formatCurrency(amount)}
                        </p>
                      ),
                    )}
                  </TableCell>
                  <TableCell className="space-y-1">
                    {Object.entries(event.byFiscalYear).map(
                      ([year, amount]) => (
                        <Badge key={year} variant="outline" className="mr-1">
                          {year}年度 {formatCurrency(amount)}
                        </Badge>
                      ),
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>イベントテンプレート（ガイド表示）</CardTitle>
          <CardDescription>
            UC-5.4/5.5 のモックとして定義内容を参照できます。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded-md border p-3">
              <p className="font-medium">{template.name}</p>
              <div className="mt-2 space-y-1 text-sm">
                {template.defaultTransactions.map((item, index) => (
                  <p key={`${template.id}-${item.categoryId}-${index}`}>
                    {item.categoryId} / {formatCurrency(item.amount)} /{' '}
                    {item.name}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/events/')({
  component: EventsPage,
})
