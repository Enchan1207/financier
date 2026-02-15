import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@frontend/components/ui/alert'
import { Badge } from '@frontend/components/ui/badge'
import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import { Input } from '@frontend/components/ui/input'
import { Label } from '@frontend/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@frontend/components/ui/table'
import { Textarea } from '@frontend/components/ui/textarea'
import {
  useTransactionActions,
  useTransactionFormOptionsQuery,
  useTransactionListQuery,
} from '@frontend/hooks/use-mock-finance-store'
import { formatCurrency, formatDate } from '@frontend/lib/financier-format'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

const TransactionsPage = () => {
  const { data: transactions } = useTransactionListQuery()
  const { data: options } = useTransactionFormOptionsQuery()
  const { createTransaction } = useTransactionActions()

  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [transactionDate, setTransactionDate] = useState('2026-02-15')
  const [eventId, setEventId] = useState('none')
  const [name, setName] = useState('')
  const [feedback, setFeedback] = useState<{
    variant: 'default' | 'destructive'
    title: string
    description?: string
  } | null>(null)

  const availableCategories = useMemo(() => {
    return type === 'income'
      ? options.incomeCategories
      : options.expenseCategories
  }, [options.expenseCategories, options.incomeCategories, type])

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsedAmount = Number(amount)
    const result = createTransaction({
      type,
      amount: parsedAmount,
      categoryId,
      transactionDate,
      eventId: eventId === 'none' ? undefined : eventId,
      name,
    })

    if (!result.ok) {
      setFeedback({
        variant: 'destructive',
        title: '登録に失敗しました',
        description: result.message,
      })

      return
    }

    setFeedback({
      variant: 'default',
      title: '取引を登録しました',
      description: '一覧に即時反映されています。',
    })
    setAmount('')
    setName('')
    setEventId('none')
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>取引（Transaction）</CardTitle>
          <CardDescription>
            UC-1 系の基本導線です。未来日取引と積立拠出の業務ルールを mock hook
            で判定します。
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>取引を登録</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>種別</Label>
                <Select
                  value={type}
                  onValueChange={(value: 'income' | 'expense') => {
                    setType(value)
                    setCategoryId('')
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="種別を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">収入</SelectItem>
                    <SelectItem value="expense">支出</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>カテゴリ</Label>
                <Select
                  value={categoryId}
                  onValueChange={(value) => {
                    setCategoryId(value)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="カテゴリを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount">金額（円）</Label>
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value)
                  }}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="transaction-date">日付</Label>
                <Input
                  id="transaction-date"
                  type="date"
                  value={transactionDate}
                  onChange={(event) => {
                    setTransactionDate(event.target.value)
                  }}
                  required
                />
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label>イベント（任意）</Label>
                <Select value={eventId} onValueChange={setEventId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="イベントを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">紐付けなし</SelectItem>
                    {options.events.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="name">名前</Label>
                <Textarea
                  id="name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                  }}
                  placeholder="取引の名前を入力"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-fit">
              登録する
            </Button>
          </form>

          {feedback !== null && (
            <Alert className="mt-4" variant={feedback.variant}>
              <AlertTitle>{feedback.title}</AlertTitle>
              <AlertDescription>{feedback.description}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>取引一覧</CardTitle>
          <CardDescription>
            未来日取引は「未来日」バッジで識別し、年度帰属を併記します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead>種別</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead>イベント</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {formatDate(transaction.transactionDate)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.type === 'income' ? 'secondary' : 'outline'
                      }
                    >
                      {transaction.type === 'income' ? '収入' : '支出'}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.categoryName}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>{transaction.eventName ?? 'なし'}</TableCell>
                  <TableCell className="space-x-2">
                    {transaction.isFuture && <Badge>未来日</Badge>}
                    <Badge variant="outline">
                      {transaction.fiscalYear}年度
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="ghost">
                      <Link
                        to="/transactions/$transactionId"
                        params={{ transactionId: transaction.id }}
                      >
                        詳細
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/transactions/')({
  component: TransactionsPage,
})
