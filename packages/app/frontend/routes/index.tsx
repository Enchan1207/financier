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
import { formatCurrency, formatDate } from '@frontend/lib/format'
import { TODAY } from '@frontend/lib/today'
import type {
  AnnualBudget,
  Category,
  SavingDefinition,
  Transaction,
} from '@frontend/lib/types'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, CalendarClock, TrendingDown, Wallet } from 'lucide-react'
import { useState } from 'react'

// モックデータ：本番ではAPIから取得する
const categories: Category[] = [
  {
    id: 'cat-1',
    name: '食費',
    type: 'expense',
    isSaving: false,
    icon: 'utensils',
    color: 'orange',
  },
  {
    id: 'cat-2',
    name: '交通費',
    type: 'expense',
    isSaving: false,
    icon: 'bus',
    color: 'blue',
  },
  {
    id: 'cat-3',
    name: '外食',
    type: 'expense',
    isSaving: false,
    icon: 'coffee',
    color: 'yellow',
  },
  {
    id: 'cat-4',
    name: '娯楽・グッズ',
    type: 'expense',
    isSaving: false,
    icon: 'music',
    color: 'purple',
  },
  {
    id: 'cat-5',
    name: '衣服',
    type: 'expense',
    isSaving: false,
    icon: 'shirt',
    color: 'pink',
  },
  {
    id: 'cat-6',
    name: '日用品',
    type: 'expense',
    isSaving: false,
    icon: 'shopping_cart',
    color: 'teal',
  },
  {
    id: 'cat-7',
    name: '美容',
    type: 'expense',
    isSaving: false,
    icon: 'heart_pulse',
    color: 'red',
  },
  {
    id: 'cat-8',
    name: '積立：遠征費',
    type: 'expense',
    isSaving: true,
    icon: 'piggy_bank',
    color: 'blue',
  },
  {
    id: 'cat-9',
    name: '積立：グッズ',
    type: 'expense',
    isSaving: true,
    icon: 'piggy_bank',
    color: 'green',
  },
  {
    id: 'cat-11',
    name: '積立：旅行費',
    type: 'expense',
    isSaving: true,
    icon: 'piggy_bank',
    color: 'orange',
  },
  {
    id: 'cat-12',
    name: '積立：機材費',
    type: 'expense',
    isSaving: true,
    icon: 'piggy_bank',
    color: 'purple',
  },
  {
    id: 'cat-13',
    name: '積立：緊急資金',
    type: 'expense',
    isSaving: true,
    icon: 'piggy_bank',
    color: 'teal',
  },
  {
    id: 'cat-10',
    name: '給与',
    type: 'income',
    isSaving: false,
    icon: 'trending_up',
    color: 'green',
  },
]

const transactions: Transaction[] = [
  {
    id: 'tx-1',
    type: 'income',
    amount: 282000,
    categoryId: 'cat-10',
    categoryName: '給与',
    transactionDate: '2026-02-03',
    name: '2月分給与',
  },
  {
    id: 'tx-2',
    type: 'expense',
    amount: 500,
    categoryId: 'cat-2',
    categoryName: '交通費',
    transactionDate: '2026-02-03',
    name: '定期外乗車',
  },
  {
    id: 'tx-3',
    type: 'expense',
    amount: 1850,
    categoryId: 'cat-1',
    categoryName: '食費',
    transactionDate: '2026-02-05',
    name: 'スーパー',
  },
  {
    id: 'tx-4',
    type: 'expense',
    amount: 1200,
    categoryId: 'cat-3',
    categoryName: '外食',
    transactionDate: '2026-02-07',
    name: 'ランチ',
  },
  {
    id: 'tx-5',
    type: 'expense',
    amount: 30000,
    categoryId: 'cat-8',
    categoryName: '積立：遠征費',
    transactionDate: '2026-02-08',
    name: '2月分積立',
  },
  {
    id: 'tx-6',
    type: 'expense',
    amount: 6500,
    categoryId: 'cat-7',
    categoryName: '美容',
    transactionDate: '2026-02-10',
    name: 'カット・カラー',
  },
  {
    id: 'tx-7',
    type: 'expense',
    amount: 2200,
    categoryId: 'cat-1',
    categoryName: '食費',
    transactionDate: '2026-02-12',
    name: 'スーパー',
  },
  {
    id: 'tx-8',
    type: 'expense',
    amount: 150000,
    categoryId: 'cat-5',
    categoryName: '衣服',
    transactionDate: '2026-02-14',
    name: 'バレンタインコーデ',
    eventId: 'ev-1',
    eventName: 'バレンタインイベント',
  },
  {
    id: 'tx-9',
    type: 'expense',
    amount: 4200,
    categoryId: 'cat-4',
    categoryName: '娯楽・グッズ',
    transactionDate: '2026-02-15',
    name: 'ぬいぐるみ',
    eventId: 'ev-1',
    eventName: 'バレンタインイベント',
  },
  {
    id: 'tx-10',
    type: 'expense',
    amount: 1800,
    categoryId: 'cat-6',
    categoryName: '日用品',
    transactionDate: '2026-02-17',
    name: '薬局',
  },
  {
    id: 'tx-11',
    type: 'expense',
    amount: 980,
    categoryId: 'cat-1',
    categoryName: '食費',
    transactionDate: '2026-02-18',
    name: 'コンビニ',
  },
  {
    id: 'tx-12',
    type: 'expense',
    amount: 2800,
    categoryId: 'cat-2',
    categoryName: '交通費',
    transactionDate: '2026-02-20',
    name: '春ライブ 新幹線',
    eventId: 'ev-2',
    eventName: '春ライブ遠征',
  },
  {
    id: 'tx-13',
    type: 'expense',
    amount: 8500,
    categoryId: 'cat-4',
    categoryName: '娯楽・グッズ',
    transactionDate: '2026-02-20',
    name: 'ライブグッズ',
    eventId: 'ev-2',
    eventName: '春ライブ遠征',
  },
  {
    id: 'tx-14',
    type: 'expense',
    amount: 2400,
    categoryId: 'cat-3',
    categoryName: '外食',
    transactionDate: '2026-02-21',
    name: '遠征ご飯',
    eventId: 'ev-2',
    eventName: '春ライブ遠征',
  },
  {
    id: 'tx-15',
    type: 'expense',
    amount: 1600,
    categoryId: 'cat-1',
    categoryName: '食費',
    transactionDate: '2026-02-24',
    name: 'スーパー',
  },
  {
    id: 'tx-16',
    type: 'expense',
    amount: 3200,
    categoryId: 'cat-3',
    categoryName: '外食',
    transactionDate: '2026-02-26',
    name: '友人と夕飯',
  },
  {
    id: 'tx-17',
    type: 'expense',
    amount: 1200,
    categoryId: 'cat-1',
    categoryName: '食費',
    transactionDate: '2026-02-28',
    name: 'コンビニ',
  },
  {
    id: 'tx-18',
    type: 'expense',
    amount: 5500,
    categoryId: 'cat-4',
    categoryName: '娯楽・グッズ',
    transactionDate: '2026-03-05',
    name: '新グッズ発売',
    eventId: 'ev-3',
    eventName: '春グッズ',
  },
  {
    id: 'tx-19',
    type: 'expense',
    amount: 8000,
    categoryId: 'cat-2',
    categoryName: '交通費',
    transactionDate: '2026-03-20',
    name: '春遠征 新幹線',
    eventId: 'ev-2',
    eventName: '春ライブ遠征',
  },
  {
    id: 'tx-20',
    type: 'expense',
    amount: 12000,
    categoryId: 'cat-4',
    categoryName: '娯楽・グッズ',
    transactionDate: '2026-03-20',
    name: '春ライブグッズ予定',
    eventId: 'ev-2',
    eventName: '春ライブ遠征',
  },
  {
    id: 'tx-21',
    type: 'expense',
    amount: 3000,
    categoryId: 'cat-3',
    categoryName: '外食',
    transactionDate: '2026-03-21',
    name: '遠征飯予定',
    eventId: 'ev-2',
    eventName: '春ライブ遠征',
  },
  {
    id: 'tx-22',
    type: 'expense',
    amount: 15000,
    categoryId: 'cat-5',
    categoryName: '衣服',
    transactionDate: '2026-04-05',
    name: '春物購入予定',
  },
]

// 積立カテゴリは予算設定対象外
const annualBudgets: AnnualBudget[] = [
  {
    categoryId: 'cat-10',
    categoryName: '給与',
    annualBudget: 5000000,
    currentMonthActual: 282000,
  },
  {
    categoryId: 'cat-1',
    categoryName: '食費',
    annualBudget: 264000,
    currentMonthActual: 7830,
  },
  {
    categoryId: 'cat-2',
    categoryName: '交通費',
    annualBudget: 120000,
    currentMonthActual: 3300,
  },
  {
    categoryId: 'cat-3',
    categoryName: '外食',
    annualBudget: 96000,
    currentMonthActual: 6800,
  },
  {
    categoryId: 'cat-4',
    categoryName: '娯楽・グッズ',
    annualBudget: 216000,
    currentMonthActual: 12700,
  },
  {
    categoryId: 'cat-5',
    categoryName: '衣服',
    annualBudget: 120000,
    currentMonthActual: 7800,
  },
  {
    categoryId: 'cat-6',
    categoryName: '日用品',
    annualBudget: 2000,
    currentMonthActual: 1800,
  },
  {
    categoryId: 'cat-7',
    categoryName: '美容',
    annualBudget: 84000,
    currentMonthActual: 6500,
  },
]

const savings: SavingDefinition[] = [
  {
    id: 'sav-1',
    categoryId: 'cat-8',
    categoryName: '遠征費積立',
    categoryIcon: 'plane',
    categoryColor: 'blue',
    type: 'goal',
    targetAmount: 200000,
    deadline: '2026-08-01',
    balance: 90000,
    monthlyGuide: 22000,
  },
  {
    id: 'sav-2',
    categoryId: 'cat-9',
    categoryName: 'グッズ積立',
    categoryIcon: 'gift',
    categoryColor: 'purple',
    type: 'free',
    balance: 35000,
  },
  {
    id: 'sav-3',
    categoryId: 'cat-11',
    categoryName: '旅行費積立',
    categoryIcon: 'plane',
    categoryColor: 'teal',
    type: 'goal',
    targetAmount: 70000,
    deadline: '2026-12-01',
    balance: 18000,
    monthlyGuide: 6000,
  },
  {
    id: 'sav-4',
    categoryId: 'cat-12',
    categoryName: '機材費積立',
    categoryIcon: 'zap',
    categoryColor: 'yellow',
    type: 'goal',
    targetAmount: 200000,
    deadline: '2026-06-30',
    balance: 170000,
    monthlyGuide: 25000,
  },
  {
    id: 'sav-5',
    categoryId: 'cat-13',
    categoryName: '緊急資金',
    categoryIcon: 'piggy_bank',
    categoryColor: 'green',
    type: 'free',
    balance: 150000,
  },
]

const internalBalance = 1243800

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

  const totalMonthlyBudget = annualBudgets.reduce(
    (s, b) => s + Math.round(b.annualBudget / 12),
    0,
  )
  const overallRate = Math.round((thisMonthExpense / totalMonthlyBudget) * 100)

  const budgetsSorted: AnnualBudget[] = annualBudgets.sort((a, b) => {
    const rateA = a.currentMonthActual / (a.annualBudget / 12)
    const rateB = b.currentMonthActual / (b.annualBudget / 12)
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
              const monthlyBudget = Math.round(b.annualBudget / 12)
              const rate = Math.round(
                (b.currentMonthActual / monthlyBudget) * 100,
              )
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
                      {formatCurrency(b.currentMonthActual)}
                      <span className="text-xs">
                        {' '}
                        / {formatCurrency(monthlyBudget)}
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
