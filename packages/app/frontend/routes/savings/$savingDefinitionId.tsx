import { PageHeader } from '@frontend/components/layout/page-header'
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
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
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
  useSavingActions,
  useSavingDetailQuery,
} from '@frontend/hooks/use-mock-finance-store'
import {
  formatCurrency,
  formatDate,
  formatRatio,
} from '@frontend/lib/financier-format'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

const SavingDetailPage = () => {
  const { savingDefinitionId } = Route.useParams()
  const { data } = useSavingDetailQuery(savingDefinitionId)
  const { createSavingWithdrawal } = useSavingActions()

  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState<{
    variant: 'default' | 'destructive'
    title: string
    description?: string
  } | null>(null)

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = createSavingWithdrawal({
      savingDefinitionId,
      amount: Number.parseInt(amount, 10),
      memo,
    })

    if (!result.ok) {
      setFeedback({
        variant: 'destructive',
        title: '取り崩しに失敗しました',
        description: result.message,
      })

      return
    }

    setFeedback({
      variant: 'default',
      title: '取り崩しを登録しました',
      description: '取引は作成せず、取り崩し履歴のみ更新されます。',
    })
    setAmount('')
    setMemo('')
    setIsWithdrawDialogOpen(false)
  }

  if (data === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>積立が見つかりません</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/savings">一覧へ戻る</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title={data.categoryName}
        actions={
          <Button asChild variant="outline">
            <Link to="/savings">一覧へ戻る</Link>
          </Button>
        }
      />

      <Dialog
        open={isWithdrawDialogOpen}
        onOpenChange={setIsWithdrawDialogOpen}
      >
        <Card>
          <CardHeader>
            <CardTitle>積立取り崩し</CardTitle>
            <CardAction>
              <DialogTrigger asChild>
                <Button>取り崩しを登録</Button>
              </DialogTrigger>
            </CardAction>
          </CardHeader>
        </Card>

        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>積立取り崩しを登録</DialogTitle>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="withdraw-amount">取り崩し額</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(targetEvent) => {
                    setAmount(targetEvent.target.value)
                  }}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="withdraw-memo">メモ（任意）</Label>
                <Input
                  id="withdraw-memo"
                  value={memo}
                  onChange={(targetEvent) => {
                    setMemo(targetEvent.target.value)
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
              <Button type="submit">登録する</Button>
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
          <CardTitle>積立状況</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <p>
            種別:{' '}
            <Badge variant="outline">
              {data.definition.type === 'goal' ? '目標型' : '自由型'}
            </Badge>
          </p>
          <p>残高: {formatCurrency(data.balance)}</p>
          <p>
            目標額:{' '}
            {data.definition.targetAmount === undefined
              ? '-'
              : formatCurrency(data.definition.targetAmount)}
          </p>
          <p>
            進捗率:{' '}
            {data.goalProgress === undefined
              ? '-'
              : formatRatio(data.goalProgress)}
          </p>
          <p>
            残額:{' '}
            {data.remainAmount === undefined
              ? '-'
              : formatCurrency(data.remainAmount)}
          </p>
          <p>
            月次差分:{' '}
            {data.monthlyGap === undefined
              ? '-'
              : formatCurrency(data.monthlyGap)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>取り崩し履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead>メモ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.withdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    取り崩し履歴はありません
                  </TableCell>
                </TableRow>
              ) : (
                data.withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      {formatDate(withdrawal.withdrawalDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(withdrawal.amount)}
                    </TableCell>
                    <TableCell>{withdrawal.memo?.trim() || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/savings/$savingDefinitionId')({
  component: SavingDetailPage,
})
