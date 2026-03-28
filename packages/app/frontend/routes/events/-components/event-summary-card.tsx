import { CategoryIcon } from '@frontend/components/category/category-icon'
import type {
  CategoryColor,
  CategoryIconType,
} from '@frontend/components/category/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import { Progress } from '@frontend/components/ui/progress'
import { Separator } from '@frontend/components/ui/separator'
import type React from 'react'

import type { EventDetailItem } from '../-repositories/events'

const formatCurrency = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`

type Props = {
  total: number
  categoryBreakdown: EventDetailItem['categoryBreakdown']
}

export const EventSummaryCard: React.FC<Props> = ({
  total,
  categoryBreakdown,
}) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base">集計サマリー</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">合計金額</p>
        <p className="text-3xl font-bold">{formatCurrency(total)}</p>
      </div>
      <Separator />
      {categoryBreakdown.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            カテゴリ別
          </p>
          {categoryBreakdown.map((cat) => (
            <div key={cat.categoryName} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <CategoryIcon
                    icon={cat.categoryIcon as CategoryIconType}
                    color={cat.categoryColor as CategoryColor}
                    className="size-3.5 shrink-0"
                  />
                  {cat.categoryName}
                </span>
                <span className="font-mono">{formatCurrency(cat.amount)}</span>
              </div>
              <Progress
                value={total > 0 ? (cat.amount / total) * 100 : 0}
                className="h-1.5"
              />
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
)
