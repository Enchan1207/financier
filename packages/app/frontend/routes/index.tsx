import { Badge } from '@frontend/components/ui/badge'
import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import { Input } from '@frontend/components/ui/input'
import { Progress } from '@frontend/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select'
import {
  categories,
  formatCurrency,
  formatDate,
  internalBalance,
  monthlyBudgets,
  savings,
  TODAY,
  transactions,
} from '@frontend/lib/mock-data'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, CalendarClock, TrendingDown, Wallet } from 'lucide-react'
import { useState } from 'react'

const HomePage: React.FC = () => {
  const [formCategory, setFormCategory] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formName, setFormName] = useState('')
  const [formDate, setFormDate] = useState(TODAY)

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const thisMonthExpense = transactions
    .filter(
      (tx) =>
        tx.type === 'expense' &&
        tx.transactionDate <= TODAY &&
        tx.transactionDate.startsWith('2026-02'),
    )
    .reduce((s, tx) => s + tx.amount, 0)

  const recentTransactions = transactions
    .filter((tx) => tx.transactionDate <= TODAY)
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
    .slice(0, 5)

  const upcomingTransactions = transactions
    .filter((tx) => tx.transactionDate > TODAY)
    .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate))
    .slice(0, 4)

  const totalMonthlyBudget = monthlyBudgets.reduce(
    (s, b) => s + b.monthlyBudget,
    0,
  )
  const overallRate = Math.round((thisMonthExpense / totalMonthlyBudget) * 100)

  const budgetsSorted = [...monthlyBudgets].sort((a, b) => {
    const rateA = a.actualAmount / a.monthlyBudget
    const rateB = b.actualAmount / b.monthlyBudget
    return rateB - rateA
  })

  return (
    <div className="space-y-6">
      {/* サマリー */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span>内部残高</span>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {formatCurrency(internalBalance)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4" />
              <span>今月の支出</span>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {formatCurrency(thisMonthExpense)}
            </p>
            <div className="mt-2 space-y-1">
              <Progress value={overallRate} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                予算の {overallRate}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* クイック支出登録 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">支出を記録</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
            <Select value={formCategory} onValueChange={setFormCategory}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="カテゴリ" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative sm:w-32">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                ¥
              </span>
              <Input
                type="number"
                placeholder="0"
                value={formAmount}
                onChange={(e) => {
                  setFormAmount(e.target.value)
                }}
                className="pl-7"
              />
            </div>

            <Input
              placeholder="内容"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value)
              }}
              className="flex-1"
            />

            <Input
              type="date"
              value={formDate}
              onChange={(e) => {
                setFormDate(e.target.value)
              }}
              className="sm:w-36"
            />

            <Button
              className="w-full sm:w-auto"
              disabled={!formCategory || !formAmount || !formName}
            >
              記録する
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 今月の予算 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">今月の予算</CardTitle>
              <Link
                to="/budget"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                詳細 <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetsSorted.map((b) => {
              const rate = Math.round((b.actualAmount / b.monthlyBudget) * 100)
              const status =
                rate >= 100 ? 'over' : rate >= 80 ? 'warning' : 'ok'

              return (
                <div key={b.categoryId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <span>{b.categoryName}</span>
                      {status === 'over' && (
                        <Badge
                          variant="destructive"
                          className="px-1 py-0 text-xs"
                        >
                          超過
                        </Badge>
                      )}
                      {status === 'warning' && (
                        <Badge
                          variant="outline"
                          className="px-1 py-0 text-xs border-yellow-500 text-yellow-600"
                        >
                          注意
                        </Badge>
                      )}
                    </div>
                    <span className="text-muted-foreground tabular-nums">
                      {formatCurrency(b.actualAmount)}
                      <span className="text-xs">
                        {' '}
                        / {formatCurrency(b.monthlyBudget)}
                      </span>
                    </span>
                  </div>
                  <Progress
                    value={Math.min(rate, 100)}
                    className={`h-1.5 ${
                      status === 'over'
                        ? '[&>div]:bg-destructive'
                        : status === 'warning'
                          ? '[&>div]:bg-yellow-500'
                          : ''
                    }`}
                  />
                </div>
              )
            })}

            {/* 積立サマリー */}
            <div className="border-t pt-4 mt-2 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">積立</p>
              {savings.map((sav) => {
                const rate = sav.targetAmount
                  ? Math.round((sav.balance / sav.targetAmount) * 100)
                  : null
                return (
                  <div key={sav.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{sav.categoryName}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {formatCurrency(sav.balance)}
                        {sav.targetAmount && (
                          <span className="text-xs">
                            {' '}
                            / {formatCurrency(sav.targetAmount)}
                          </span>
                        )}
                      </span>
                    </div>
                    {rate !== null && (
                      <Progress value={rate} className="h-1.5" />
                    )}
                  </div>
                )
              })}
              <Link
                to="/savings"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                積立詳細 <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* 最近の取引 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">最近の取引</CardTitle>
                <Link
                  to="/transactions"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  すべて見る <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 p-0 px-6 pb-4">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                      {formatDate(tx.transactionDate)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm">{tx.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.categoryName}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`ml-2 shrink-0 font-mono text-sm tabular-nums ${
                      tx.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-foreground'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 近日の予定 */}
          {upcomingTransactions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">近日の予定支出</CardTitle>
                  </div>
                  <Link
                    to="/transactions"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    すべて見る <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 p-0 px-6 pb-4">
                {upcomingTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                        {formatDate(tx.transactionDate)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm">{tx.name}</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          <p className="text-xs text-muted-foreground">
                            {tx.categoryName}
                          </p>
                          {tx.eventName && (
                            <Badge
                              variant="outline"
                              className="px-1 py-0 text-xs"
                            >
                              {tx.eventName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="ml-2 shrink-0 font-mono text-sm text-muted-foreground tabular-nums">
                      -{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage,
})
