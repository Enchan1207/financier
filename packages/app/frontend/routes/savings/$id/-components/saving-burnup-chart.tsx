import type { ChartConfig } from '@frontend/components/ui/chart'
import { ChartContainer, ChartTooltip } from '@frontend/components/ui/chart'
import dayjs from '@frontend/lib/date'
import { formatCurrency } from '@frontend/lib/format'
import { TODAY } from '@frontend/lib/today'
import type { SavingWithdrawal, Transaction } from '@frontend/lib/types'
import type React from 'react'
import type { TooltipProps } from 'recharts'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'

type ChartPoint = {
  label: string
  balance: number
  monthContrib: number
  monthWithdrawal: number
}

/** 月次累積残高データを構築する */
function buildChartData(
  contributions: Transaction[],
  withdrawals: SavingWithdrawal[],
): ChartPoint[] {
  const currentMonth = TODAY.slice(0, 7)

  // 登場する月を収集し、今月まで含める
  const monthSet = new Set<string>([currentMonth])
  contributions.forEach((tx) => monthSet.add(tx.transactionDate.slice(0, 7)))
  withdrawals.forEach((w) => monthSet.add(w.withdrawalDate.slice(0, 7)))

  const months = [...monthSet].filter((m) => m <= currentMonth).sort()

  return months.map((month) => {
    const monthContrib = contributions
      .filter((tx) => tx.transactionDate.slice(0, 7) === month)
      .reduce((sum, tx) => sum + tx.amount, 0)
    const monthWithdrawal = withdrawals
      .filter((w) => w.withdrawalDate.slice(0, 7) === month)
      .reduce((sum, w) => sum + w.amount, 0)
    const cumContrib = contributions
      .filter((tx) => tx.transactionDate.slice(0, 7) <= month)
      .reduce((sum, tx) => sum + tx.amount, 0)
    const cumWithdrawal = withdrawals
      .filter((w) => w.withdrawalDate.slice(0, 7) <= month)
      .reduce((sum, w) => sum + w.amount, 0)

    return {
      label: dayjs(month).format('YY/M'),
      balance: cumContrib - cumWithdrawal,
      monthContrib,
      monthWithdrawal,
    }
  })
}

const BurnupTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
}) => {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as ChartPoint
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{point.label}</p>
      <p className="tabular-nums">{formatCurrency(point.balance)}</p>
      {point.monthContrib > 0 && (
        <p className="tabular-nums text-emerald-600">
          +{formatCurrency(point.monthContrib)}
        </p>
      )}
      {point.monthWithdrawal > 0 && (
        <p className="tabular-nums text-rose-600">
          -{formatCurrency(point.monthWithdrawal)}
        </p>
      )}
    </div>
  )
}

type Props = {
  contributions: Transaction[]
  withdrawals: SavingWithdrawal[]
  targetAmount?: number
}

const chartConfig = {
  balance: { label: '累積残高', color: 'var(--chart-1)' },
} satisfies ChartConfig

export const SavingBurnupChart: React.FC<Props> = ({
  contributions,
  withdrawals,
  targetAmount,
}) => {
  const data = buildChartData(contributions, withdrawals)

  // データ点が2件未満の場合は表示しない
  if (data.length < 2) return null

  const maxBalance = Math.max(...data.map((d) => d.balance))

  return (
    <ChartContainer config={chartConfig} className="h-40 w-full">
      <LineChart
        accessibilityLayer
        data={data}
        margin={{ left: 0, right: 4, top: 8, bottom: 0 }}
      >
        <YAxis
          domain={[0, targetAmount ?? maxBalance]}
          tickMargin={4}
          width={44}
          tickFormatter={(v: number) =>
            v === 0 ? '0' : `¥${Math.round(v / 1000)}k`
          }
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip content={<BurnupTooltip />} />
        {/* 目標額の参照線（goal 型のみ） */}
        {targetAmount !== undefined && (
          <ReferenceLine
            y={targetAmount}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 3"
            strokeWidth={1}
            label={{
              value: '目標',
              position: 'insideTopRight',
              fontSize: 12,
              fill: 'var(--muted-foreground)',
            }}
          />
        )}
        <Line
          dataKey="balance"
          type="monotone"
          stroke="var(--foreground)"
          strokeWidth={2}
          dot={{ r: 3, strokeWidth: 0, fill: 'var(--foreground)' }}
          activeDot={{ r: 5, strokeWidth: 0, fill: 'var(--foreground)' }}
        />
      </LineChart>
    </ChartContainer>
  )
}
