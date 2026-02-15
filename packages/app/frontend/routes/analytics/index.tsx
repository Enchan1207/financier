import { Badge } from '@frontend/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import { Input } from '@frontend/components/ui/input'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@frontend/components/ui/tabs'
import { useAnalyticsQuery } from '@frontend/hooks/use-mock-finance-store'
import {
  formatCurrency,
  formatFiscalYear,
  formatRatio,
} from '@frontend/lib/financier-format'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

const AnalyticsPage = () => {
  const [fiscalYear, setFiscalYear] = useState(2025)
  const [simulatedExpense, setSimulatedExpense] = useState(200000)

  const { data } = useAnalyticsQuery(fiscalYear, simulatedExpense)

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>分析・可視化（Analytics）</CardTitle>
          <CardDescription>
            UC-7
            系のモックです。カテゴリ分析、年度比較、投資判断支援を切り替えて確認できます。
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>分析条件</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <p className="text-sm font-medium">対象年度</p>
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
                {[2024, 2025, 2026].map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {formatFiscalYear(year)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-medium">仮想支出（投資判断支援）</p>
            <Input
              type="number"
              min={0}
              value={simulatedExpense}
              onChange={(event) => {
                setSimulatedExpense(Number(event.target.value))
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="category">
        <TabsList>
          <TabsTrigger value="category">カテゴリ別年度分析</TabsTrigger>
          <TabsTrigger value="comparison">年度間比較</TabsTrigger>
          <TabsTrigger value="decision">投資判断支援</TabsTrigger>
        </TabsList>

        <TabsContent value="category">
          <Card>
            <CardHeader>
              <CardTitle>{formatFiscalYear(fiscalYear)} カテゴリ分析</CardTitle>
              <CardDescription>
                予算との差分と構成比（円グラフ/棒グラフ相当の基礎データ）を一覧表示します。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <p>収入合計: {formatCurrency(data.incomeTotal)}</p>
                <p>支出合計: {formatCurrency(data.expenseTotal)}</p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>カテゴリ</TableHead>
                    <TableHead>種別</TableHead>
                    <TableHead className="text-right">実績</TableHead>
                    <TableHead className="text-right">予算</TableHead>
                    <TableHead className="text-right">差分</TableHead>
                    <TableHead className="text-right">構成比</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.categoryRows.map((row) => (
                    <TableRow key={`${row.type}-${row.categoryName}`}>
                      <TableCell>{row.categoryName}</TableCell>
                      <TableCell>
                        {row.type === undefined ? (
                          '-'
                        ) : (
                          <Badge
                            variant={
                              row.type === 'income' ? 'secondary' : 'outline'
                            }
                          >
                            {row.type === 'income' ? '収入' : '支出'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.actualAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.budgetAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.variance)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatRatio(row.ratio)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>年度間比較</CardTitle>
              <CardDescription>
                年度ごとの収入・支出・差分を比較して推移を確認します。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>年度</TableHead>
                    <TableHead className="text-right">収入</TableHead>
                    <TableHead className="text-right">支出</TableHead>
                    <TableHead className="text-right">差分</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.yearComparison.map((year) => (
                    <TableRow key={year.fiscalYear}>
                      <TableCell>{formatFiscalYear(year.fiscalYear)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(year.income)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(year.expense)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(year.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decision">
          <Card>
            <CardHeader>
              <CardTitle>投資判断支援</CardTitle>
              <CardDescription>
                UC-7.7
                のシナリオとして、仮想支出後の内部残高見込みを表示します。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2 text-sm md:grid-cols-3">
                <p>
                  現在内部残高:{' '}
                  {formatCurrency(data.investmentSupport.internalBalance)}
                </p>
                <p>
                  仮想支出:{' '}
                  {formatCurrency(data.investmentSupport.simulatedExpense)}
                </p>
                <p>
                  支出後見込み:{' '}
                  {formatCurrency(data.investmentSupport.afterSimulation)}
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>積立</TableHead>
                    <TableHead>型</TableHead>
                    <TableHead className="text-right">残高</TableHead>
                    <TableHead className="text-right">目標</TableHead>
                    <TableHead className="text-right">充足率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.savingProgressRows.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {row.type === 'goal' ? '目標型' : '自由型'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.balance)}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.targetAmount === undefined
                          ? '-'
                          : formatCurrency(row.targetAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.progress === undefined
                          ? '-'
                          : formatRatio(row.progress)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export const Route = createFileRoute('/analytics/')({
  component: AnalyticsPage,
})
