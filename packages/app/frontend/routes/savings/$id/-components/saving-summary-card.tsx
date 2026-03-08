import { Badge } from '@frontend/components/ui/badge'
import { Card, CardContent } from '@frontend/components/ui/card'
import { Progress } from '@frontend/components/ui/progress'
import { Separator } from '@frontend/components/ui/separator'
import dayjs from '@frontend/lib/date'
import { formatCurrency } from '@frontend/lib/format'
import { TODAY } from '@frontend/lib/today'
import type {
  SavingDefinition,
  SavingWithdrawal,
  Transaction,
} from '@frontend/lib/types'
import type React from 'react'

import { SavingBurnupChart } from './saving-burnup-chart'

type Props = {
  saving: SavingDefinition
  /** 今月の拠出実績合計 */
  thisMonthContribution: number
  contributions: Transaction[]
  withdrawals: SavingWithdrawal[]
}

export const SavingSummaryCard: React.FC<Props> = ({
  saving,
  thisMonthContribution,
  contributions,
  withdrawals,
}) => {
  const { type, targetAmount, deadline, balance } = saving

  const rate =
    type === 'goal' && targetAmount !== undefined
      ? Math.min(Math.round((balance / targetAmount) * 100), 100)
      : null

  const remaining =
    type === 'goal' && targetAmount !== undefined
      ? Math.max(targetAmount - balance, 0)
      : null

  // 月次目安額：保存済みの値を優先し、なければ残額÷残月数で算出
  const monthsLeft =
    deadline !== undefined
      ? Math.max(dayjs(deadline).diff(dayjs(TODAY), 'month'), 0)
      : null

  const monthlyGuide =
    saving.monthlyGuide ??
    (remaining !== null && monthsLeft !== null && monthsLeft > 0
      ? Math.ceil(remaining / monthsLeft)
      : null)

  // 今月の拠出と月次目安額の差分（正 = 目安超過、負 = 目安未達）
  const monthlyGuideDiff =
    monthlyGuide !== null ? thisMonthContribution - monthlyGuide : null

  return (
    <Card>
      <CardContent className="space-y-4">
        {/* 残高 + 型バッジ */}
        <div className="flex items-start justify-between gap-4">
          <div className="truncate">
            <p className="text-xs text-muted-foreground">積立残高</p>
            <p className="text-3xl font-bold tabular-nums">
              {formatCurrency(balance)}
            </p>
          </div>

          <Badge variant={type === 'goal' ? 'default' : 'secondary'}>
            {type === 'goal' ? '目標型' : '自由型'}
          </Badge>
        </div>

        {/* goal 型のみ詳細表示 */}
        {type === 'goal' && targetAmount !== undefined && (
          <>
            <Separator />
            <div className="space-y-4">
              {/* 進捗バー */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">進捗</span>
                  <span className="font-medium">{rate}%</span>
                </div>
                <Progress
                  value={rate ?? 0}
                  className={
                    (rate ?? 0) >= 80
                      ? "h-2 [&_[data-slot='progress-indicator']]:bg-green-600"
                      : 'h-2'
                  }
                />
                <div className="flex justify-between text-xs text-muted-foreground min-w-0 gap-4">
                  <span className="truncate">{formatCurrency(balance)}</span>
                  <span className="truncate">
                    {formatCurrency(targetAmount)}
                  </span>
                </div>
              </div>

              {/* 残額 + 期限 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="truncate">
                  <p className="text-xs text-muted-foreground">残額</p>
                  <p className="text-lg font-semibold tabular-nums truncate">
                    {formatCurrency(remaining ?? 0)}
                  </p>
                </div>

                {deadline !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">期限まで</p>
                    <p className="text-lg font-semibold text-primary">
                      {dayjs(deadline).fromNow(true)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dayjs(deadline).format('YYYY年M月D日')}
                    </p>
                  </div>
                )}
              </div>

              {/* 月次目安額 + 今月の差分（期限設定時のみ） */}
              {monthlyGuide !== null && (
                <div className="grid grid-cols-2 gap-4 truncate">
                  <div>
                    <p className="text-xs text-muted-foreground">月次目安額</p>
                    <p className="text-lg font-semibold tabular-nums truncate">
                      {formatCurrency(monthlyGuide)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">今月の差分</p>
                    <p
                      className={`text-lg font-semibold tabular-nums truncate ${
                        (monthlyGuideDiff ?? 0) >= 0
                          ? 'text-green-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {(monthlyGuideDiff ?? 0) >= 0 ? '+' : ''}
                      {formatCurrency(monthlyGuideDiff ?? 0)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* バーンアップチャート（データが2件以上の場合のみ表示） */}
        <Separator />
        <div>
          <p className="text-xs text-muted-foreground mb-2">積立推移</p>
          <SavingBurnupChart
            contributions={contributions}
            withdrawals={withdrawals}
            targetAmount={targetAmount}
          />
        </div>
      </CardContent>
    </Card>
  )
}
