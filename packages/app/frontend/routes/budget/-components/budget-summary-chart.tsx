import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import type { ChartConfig } from '@frontend/components/ui/chart'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@frontend/components/ui/chart'
import { formatCurrency } from '@frontend/lib/format'
import type React from 'react'
import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts'

export type SummaryBarItem = {
  categoryId: string
  categoryName: string
  amount: number
  color: string
  labelColor?: string
}

type SummaryBarProps = {
  sectionLabel: string
  items: SummaryBarItem[]
}

const LABEL_MIN_WIDTH = 60

export const BudgetSummaryBar: React.FC<SummaryBarProps> = ({
  sectionLabel,
  items,
}) => {
  const total = items.reduce((sum, item) => sum + item.amount, 0)

  const data = [
    Object.fromEntries(items.map((item) => [item.categoryId, item.amount])),
  ]

  const config: ChartConfig = Object.fromEntries(
    items.map((item) => [
      item.categoryId,
      { label: item.categoryName, color: item.color },
    ]),
  )

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">
        {sectionLabel}
      </p>
      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
        <ChartContainer config={config} className="h-12 md:flex-1 aspect-auto">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <XAxis type="number" domain={[0, total]} hide />
            <YAxis type="category" hide />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            {items.map((item, idx) => {
              const isFirst = idx === 0
              const isLast = idx === items.length - 1
              const cornerRadius: [number, number, number, number] =
                isFirst && isLast
                  ? [4, 4, 4, 4]
                  : isFirst
                    ? [4, 0, 0, 4]
                    : isLast
                      ? [0, 4, 4, 0]
                      : [0, 0, 0, 0]

              return (
                <Bar
                  key={item.categoryId}
                  dataKey={item.categoryId}
                  stackId="stack"
                  fill={`var(--color-${item.categoryId})`}
                  radius={cornerRadius}
                >
                  <LabelList
                    dataKey={item.categoryId}
                    content={(props: unknown) => {
                      const { x, y, width, height, value } = props as {
                        x: number
                        y: number
                        width: number
                        height: number
                        value: number
                      }
                      if (width < LABEL_MIN_WIDTH) return null
                      const pct = Math.round((value / total) * 100)
                      return (
                        <text
                          x={x + width / 2}
                          y={y + height / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={11}
                          fill={item.labelColor ?? 'white'}
                        >
                          {item.categoryName}:&nbsp;{pct}%
                        </text>
                      )
                    }}
                  />
                </Bar>
              )
            })}
          </BarChart>
        </ChartContainer>
        <p className="text-right text-xl font-bold tabular-nums md:whitespace-nowrap">
          {formatCurrency(total)}
        </p>
      </div>
    </div>
  )
}

type Props = {
  incomeItems: SummaryBarItem[]
  expenseItems: SummaryBarItem[]
}

export const BudgetSummaryChart: React.FC<Props> = ({
  incomeItems,
  expenseItems,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>サマリー</CardTitle>
        <CardDescription>
          収入の合計額を100%とした収支の割合を表示しています。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <BudgetSummaryBar sectionLabel="収入" items={incomeItems} />
        <BudgetSummaryBar sectionLabel="支出" items={expenseItems} />
      </CardContent>
    </Card>
  )
}
