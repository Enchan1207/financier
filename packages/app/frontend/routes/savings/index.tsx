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
import {
  useSavingActions,
  useSavingListQuery,
} from '@frontend/hooks/use-mock-finance-store'
import { formatCurrency, formatRatio } from '@frontend/lib/financier-format'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

const SavingsPage = () => {
  const { data: savings } = useSavingListQuery()
  const { createSavingWithdrawal } = useSavingActions()

  const [savingDefinitionId, setSavingDefinitionId] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
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
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>積立（SavingDefinition）</CardTitle>
          <CardDescription>
            UC-4 系のモックです。拠出は取引画面、取り崩しはこの画面で扱います。
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>積立取り崩し</CardTitle>
          <CardDescription>
            取り崩し日はシステム日付を自動適用します（利用者入力不可）。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={handleSubmit}>
            <div className="grid gap-2 md:col-span-2">
              <Label>対象積立</Label>
              <Select
                value={savingDefinitionId}
                onValueChange={setSavingDefinitionId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="積立を選択" />
                </SelectTrigger>
                <SelectContent>
                  {savings.map((item) => (
                    <SelectItem
                      key={item.definition.id}
                      value={item.definition.id}
                    >
                      {item.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="withdraw-amount">取り崩し額</Label>
              <Input
                id="withdraw-amount"
                type="number"
                min={1}
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value)
                }}
                required
              />
            </div>
            <div className="grid gap-2 md:col-span-3">
              <Label htmlFor="withdraw-memo">メモ（任意）</Label>
              <Input
                id="withdraw-memo"
                value={memo}
                onChange={(event) => {
                  setMemo(event.target.value)
                }}
              />
            </div>
            <Button type="submit" className="w-fit md:col-span-3">
              取り崩しを実行
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
          <CardTitle>積立進捗一覧</CardTitle>
          <CardDescription>
            目標型は充足率と残額、期限設定がある場合は月次目安との差分を表示します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>カテゴリ</TableHead>
                <TableHead>型</TableHead>
                <TableHead className="text-right">残高</TableHead>
                <TableHead className="text-right">目標額</TableHead>
                <TableHead className="text-right">進捗率</TableHead>
                <TableHead className="text-right">残額</TableHead>
                <TableHead className="text-right">月次差分</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savings.map((item) => (
                <TableRow key={item.definition.id}>
                  <TableCell>{item.categoryName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.definition.type === 'goal' ? '目標型' : '自由型'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.balance)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.definition.targetAmount === undefined
                      ? '-'
                      : formatCurrency(item.definition.targetAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.goalProgress === undefined
                      ? '-'
                      : formatRatio(item.goalProgress)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.remainAmount === undefined
                      ? '-'
                      : formatCurrency(item.remainAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.monthlyGap === undefined
                      ? '-'
                      : formatCurrency(item.monthlyGap)}
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

export const Route = createFileRoute('/savings/')({
  component: SavingsPage,
})
