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
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeftIcon, PencilIcon } from 'lucide-react'
import { useState } from 'react'

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

type YearBreakdown = {
  fiscalYear: number
  amount: number
}

type EventDetail = {
  id: string
  name: string
  occurredOn: string
  transactions: EventTransaction[]
  categoryBreakdown: CategoryBreakdown[]
  yearBreakdown: YearBreakdown[]
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
    yearBreakdown: [{ fiscalYear: 2025, amount: 154200 }],
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
    yearBreakdown: [
      { fiscalYear: 2025, amount: 13700 },
      { fiscalYear: 2026, amount: 23000 },
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
    yearBreakdown: [{ fiscalYear: 2025, amount: 5500 }],
  },
  'ev-4': {
    id: 'ev-4',
    name: '年末飲み会',
    occurredOn: '2025-12-28',
    transactions: [
      {
        id: 'tx-99',
        date: '2025-12-28',
        name: '飲み会費',
        categoryName: '外食',
        amount: 4500,
      },
    ],
    categoryBreakdown: [{ categoryName: '外食', amount: 4500 }],
    yearBreakdown: [{ fiscalYear: 2025, amount: 4500 }],
  },
}

const formatCurrency = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`
const formatDate = (dateStr: string) => dayjs(dateStr).format('M/D')
const formatDateFull = (dateStr: string) => dayjs(dateStr).format('YYYY/M/D')

const EventDetailPage: React.FC = () => {
  const { id } = Route.useParams()
  const event = EVENT_DETAILS[id]

  const [editOpen, setEditOpen] = useState(false)
  const [formName, setFormName] = useState(event?.name ?? '')
  const [formDate, setFormDate] = useState(event?.occurredOn ?? '')
  const [currentName, setCurrentName] = useState(event?.name ?? '')

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

  const total = event.transactions.reduce((sum, tx) => sum + tx.amount, 0)

  const handleEdit = () => {
    setCurrentName(formName)
    setEditOpen(false)
  }

  return (
    <div className="space-y-6">
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
          {/* 編集ダイアログ（UC-5.6） */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setFormName(currentName)
                }}
              >
                <PencilIcon />
                編集
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>イベントを編集</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-ev-name">イベント名 *</Label>
                  <Input
                    id="edit-ev-name"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value)
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-ev-date">発生日 *</Label>
                  <Input
                    id="edit-ev-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => {
                      setFormDate(e.target.value)
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleEdit}
                  disabled={!formName.trim() || !formDate}
                >
                  保存
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
          <Separator />
          {/* 年度別内訳 */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">年度別</p>
            {event.yearBreakdown.map((yr) => (
              <div key={yr.fiscalYear} className="flex justify-between text-sm">
                <span>{yr.fiscalYear}年度</span>
                <span className="font-mono">{formatCurrency(yr.amount)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* トランザクション一覧 */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">トランザクション一覧</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9 text-xs">日付</TableHead>
                  <TableHead className="h-9 text-xs">内容</TableHead>
                  <TableHead className="h-9 text-xs">カテゴリ</TableHead>
                  <TableHead className="h-9 text-right text-xs">金額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {event.transactions.map((tx) => {
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
                      <TableCell className="py-2 text-xs">{tx.name}</TableCell>
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
      </div>
    </div>
  )
}

export const Route = createFileRoute('/events/$id/')({
  component: EventDetailPage,
})
