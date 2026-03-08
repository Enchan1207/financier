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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@frontend/components/ui/dropdown-menu'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@frontend/components/ui/empty'
import { Progress } from '@frontend/components/ui/progress'
import { Separator } from '@frontend/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@frontend/components/ui/table'
import dayjs from '@frontend/lib/date'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  PlusIcon,
  ReceiptIcon,
  Trash2Icon,
} from 'lucide-react'
import { useState } from 'react'

import type { NewTransaction } from '../-components/event-add-transaction-dialog'
import { EventAddTransactionDialog } from '../-components/event-add-transaction-dialog'
import { EventEditDialog } from '../-components/event-edit-dialog'
import type { LinkedTransaction } from '../-components/event-link-transaction-dialog'
import { EventLinkTransactionDialog } from '../-components/event-link-transaction-dialog'

const TODAY = '2026-02-28'

type EventTransaction = {
  id: string
  date: string
  name: string
  categoryName: string
  amount: number
}

type CategoryBreakdown = {
  categoryName: string
  amount: number
}

type EventDetail = {
  id: string
  name: string
  occurredOn: string
  transactions: EventTransaction[]
  categoryBreakdown: CategoryBreakdown[]
}

// モックデータ：本番ではAPIから /events/:id を呼び出す
const EVENT_DETAILS: Record<string, EventDetail> = {
  'ev-1': {
    id: 'ev-1',
    name: 'バレンタインイベント',
    occurredOn: '2026-02-14',
    transactions: [
      {
        id: 'tx-8',
        date: '2026-02-14',
        name: 'バレンタインコーデ',
        categoryName: '衣服',
        amount: 150000,
      },
      {
        id: 'tx-9',
        date: '2026-02-15',
        name: 'ぬいぐるみ',
        categoryName: '娯楽・グッズ',
        amount: 4200,
      },
    ],
    categoryBreakdown: [
      { categoryName: '衣服', amount: 150000 },
      { categoryName: '娯楽・グッズ', amount: 4200 },
    ],
  },
  'ev-2': {
    id: 'ev-2',
    name: '春ライブ遠征',
    occurredOn: '2026-02-20',
    transactions: [
      {
        id: 'tx-12',
        date: '2026-02-20',
        name: '春ライブ 新幹線',
        categoryName: '交通費',
        amount: 2800,
      },
      {
        id: 'tx-13',
        date: '2026-02-20',
        name: 'ライブグッズ',
        categoryName: '娯楽・グッズ',
        amount: 8500,
      },
      {
        id: 'tx-14',
        date: '2026-02-21',
        name: '遠征ご飯',
        categoryName: '外食',
        amount: 2400,
      },
      {
        id: 'tx-19',
        date: '2026-03-20',
        name: '春遠征 新幹線',
        categoryName: '交通費',
        amount: 8000,
      },
      {
        id: 'tx-20',
        date: '2026-03-20',
        name: '春ライブグッズ予定',
        categoryName: '娯楽・グッズ',
        amount: 12000,
      },
      {
        id: 'tx-21',
        date: '2026-03-21',
        name: '遠征飯予定',
        categoryName: '外食',
        amount: 3000,
      },
    ],
    categoryBreakdown: [
      { categoryName: '交通費', amount: 10800 },
      { categoryName: '娯楽・グッズ', amount: 20500 },
      { categoryName: '外食', amount: 5400 },
    ],
  },
  'ev-3': {
    id: 'ev-3',
    name: '春グッズ',
    occurredOn: '2026-03-05',
    transactions: [
      {
        id: 'tx-18',
        date: '2026-03-05',
        name: '新グッズ発売',
        categoryName: '娯楽・グッズ',
        amount: 5500,
      },
    ],
    categoryBreakdown: [{ categoryName: '娯楽・グッズ', amount: 5500 }],
  },
  'ev-4': {
    id: 'ev-4',
    name: '年末飲み会',
    occurredOn: '2025-12-28',
    transactions: [],
    categoryBreakdown: [],
  },
}

const formatCurrency = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`
const formatDate = (dateStr: string) => dayjs(dateStr).format('M/D')
const formatDateFull = (dateStr: string) => dayjs(dateStr).format('YYYY/M/D')

const EventDetailPage: React.FC = () => {
  const { id } = Route.useParams()
  const event = EVENT_DETAILS[id]

  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [currentName, setCurrentName] = useState(event?.name ?? '')
  const [transactions, setTransactions] = useState(event?.transactions ?? [])

  if (!event) {
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

  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0)

  const handleAddTransaction = (tx: NewTransaction) => {
    // モック：実際にはAPIを呼び出してトランザクションを追加する
    setTransactions((prev) => [
      ...prev,
      { id: `tx-mock-${dayjs().valueOf()}`, ...tx },
    ])
  }

  const handleLinkTransaction = (tx: LinkedTransaction) => {
    // モック：実際にはAPIを呼び出してトランザクションを紐付ける
    setTransactions((prev) => [...prev, tx])
  }

  const handleDelete = () => {
    // モック：実際にはAPIを呼び出してイベントを削除する（UC-5.7）
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
            <h1 className="text-2xl font-bold">{currentName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateFull(event.occurredOn)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 編集ダイアログ（UC-5.6） */}
            <EventEditDialog
              open={editOpen}
              onOpenChange={setEditOpen}
              defaultName={currentName}
              defaultDate={event.occurredOn}
              onSave={async (name) => {
                // モック：実際にはAPIを呼び出してイベントを更新する（UC-5.6）
                await new Promise((resolve) => setTimeout(resolve, 1000))
                setCurrentName(name)
              }}
            />

            {/* transactionCount === 0 の場合のみ削除可能（UC-5.7） */}
            {transactions.length === 0 && (
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
                      「{currentName}」を削除します。この操作は取り消せません。
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">集計サマリー</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">合計金額</p>
            <p className="text-3xl font-bold">{formatCurrency(total)}</p>
          </div>
          <Separator />
          {/* カテゴリ別内訳 */}
          {event.categoryBreakdown.length > 0 && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  カテゴリ別
                </p>
                {event.categoryBreakdown.map((cat) => (
                  <div key={cat.categoryName} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{cat.categoryName}</span>
                      <span className="font-mono">
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                    <Progress
                      value={total > 0 ? (cat.amount / total) * 100 : 0}
                      className="h-1.5"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* トランザクション一覧 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">トランザクション一覧</h2>
          {transactions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <PlusIcon />
                  追加
                  <ChevronDownIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => {
                    setNewOpen(true)
                  }}
                >
                  新規作成
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setLinkOpen(true)
                  }}
                >
                  既存の項目を追加
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <EventAddTransactionDialog
          open={newOpen}
          onOpenChange={setNewOpen}
          onAdd={handleAddTransaction}
        />
        <EventLinkTransactionDialog
          open={linkOpen}
          onOpenChange={setLinkOpen}
          alreadyLinkedIds={transactions.map((tx) => tx.id)}
          onLink={handleLinkTransaction}
        />
        {transactions.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptIcon />
              </EmptyMedia>
              <EmptyTitle>トランザクションがありません</EmptyTitle>
              <EmptyDescription>
                このイベントにトランザクションを追加してください
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setNewOpen(true)
                  }}
                >
                  <PlusIcon />
                  新規作成
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setLinkOpen(true)
                  }}
                >
                  既存の項目を追加
                </Button>
              </div>
            </EmptyContent>
          </Empty>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-9 text-xs">日付</TableHead>
                    <TableHead className="h-9 text-xs">内容</TableHead>
                    <TableHead className="h-9 text-xs">カテゴリ</TableHead>
                    <TableHead className="h-9 text-right text-xs">
                      金額
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const isFuture = tx.date > TODAY
                    return (
                      <TableRow
                        key={tx.id}
                        className={isFuture ? 'text-muted-foreground' : ''}
                      >
                        <TableCell className="py-2 font-mono text-xs">
                          {formatDate(tx.date)}
                          {isFuture && ' (予定)'}
                        </TableCell>
                        <TableCell className="py-2 text-xs">
                          {tx.name}
                        </TableCell>
                        <TableCell className="py-2 text-xs">
                          {tx.categoryName}
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono text-xs">
                          -{formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/events/$id/')({
  component: EventDetailPage,
})
