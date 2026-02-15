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
  useBudgetActions,
  useBudgetQuery,
} from '@frontend/hooks/use-mock-finance-store'
import {
  formatCurrency,
  formatFiscalYear,
} from '@frontend/lib/financier-format'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

const BudgetsPage = () => {
  const [fiscalYear, setFiscalYear] = useState(2025)
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [feedback, setFeedback] = useState<{
    variant: 'default' | 'destructive'
    title: string
    description?: string
  } | null>(null)

  const { data } = useBudgetQuery(fiscalYear)
  const { upsertBudget } = useBudgetActions()

  const targetCategories = useMemo(() => {
    return data.rows.map((row) => row.category)
  }, [data.rows])

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsed = Number.parseInt(amount, 10)
    const result = upsertBudget({
      fiscalYear,
      categoryId,
      budgetAmount: parsed,
    })

    if (!result.ok) {
      setFeedback({
        variant: 'destructive',
        title: '予算更新に失敗しました',
        description: result.message,
      })

      return
    }

    setFeedback({
      variant: 'default',
      title: '予算を更新しました',
      description: '一覧の差分に反映されています。',
    })
    setAmount('')
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="予算管理"
        description="年度とカテゴリごとに予算を設定し、実績との差分を把握できます。"
      />

      <Card>
        <CardHeader>
          <CardTitle>予算を設定・変更</CardTitle>
          <CardDescription>
            {formatFiscalYear(fiscalYear)} / 状態: {data.fiscalYearStatus}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label>年度</Label>
              <Select
                value={String(fiscalYear)}
                onValueChange={(value) => {
                  setFiscalYear(Number(value))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.selectableFiscalYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {formatFiscalYear(year)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label>カテゴリ</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="カテゴリを選択" />
                </SelectTrigger>
                <SelectContent>
                  {targetCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} (
                      {category.type === 'income' ? '収入' : '支出'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budget-amount">予算額（円）</Label>
              <Input
                id="budget-amount"
                type="number"
                min={1}
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value)
                }}
                required
              />
            </div>

            <Button type="submit" className="w-fit md:col-span-4">
              保存する
            </Button>
          </form>

          {feedback !== null && (
            <Alert className="mt-4" variant={feedback.variant}>
              <AlertTitle>{feedback.title}</AlertTitle>
              <AlertDescription>{feedback.description}</AlertDescription>
            </Alert>
          )}

          {data.showBudgetWarning && (
            <Alert className="mt-4" variant="destructive">
              <AlertTitle>警告</AlertTitle>
              <AlertDescription>
                支出予算合計が収入予算合計を上回っています（操作は継続可能）。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>予算実績一覧</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p>収入予算合計: {formatCurrency(data.totals.incomeBudget)}</p>
            <p>支出予算合計: {formatCurrency(data.totals.expenseBudget)}</p>
            <p>収入実績合計: {formatCurrency(data.totals.incomeActual)}</p>
            <p>支出実績合計: {formatCurrency(data.totals.expenseActual)}</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>カテゴリ</TableHead>
                <TableHead>種別</TableHead>
                <TableHead className="text-right">予算</TableHead>
                <TableHead className="text-right">実績</TableHead>
                <TableHead className="text-right">差分</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.category.id}>
                  <TableCell>{row.category.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.category.type === 'income' ? 'secondary' : 'outline'
                      }
                    >
                      {row.category.type === 'income' ? '収入' : '支出'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.budgetAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.actualAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.variance)}
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

export const Route = createFileRoute('/budgets/')({
  component: BudgetsPage,
})
