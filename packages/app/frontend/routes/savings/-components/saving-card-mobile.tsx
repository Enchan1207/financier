import { CategoryIcon } from '@frontend/components/category/category-icon'
import type {
  CategoryColor,
  CategoryIconType,
} from '@frontend/components/category/types'
import { Card, CardContent } from '@frontend/components/ui/card'
import { Progress } from '@frontend/components/ui/progress'
import dayjs from '@frontend/lib/date'
import { formatCurrency } from '@frontend/lib/format'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import type React from 'react'

type Props = {
  id: string
  categoryName: string
  categoryIcon: CategoryIconType
  categoryColor: CategoryColor
  type: 'goal' | 'free'
  targetAmount?: number
  deadline?: string
  balance: number
}

export const SavingCardMobile: React.FC<Props> = ({
  id,
  categoryName,
  categoryIcon,
  categoryColor,
  type,
  targetAmount,
  deadline,
  balance,
}) => {
  const rate =
    type === 'goal' && targetAmount
      ? Math.round((balance / targetAmount) * 100)
      : null

  return (
    <Link to="/savings/$id" params={{ id }} className="block h-full">
      <Card className="h-full">
        <CardContent className="flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <span className="flex items-center gap-2 line-clamp-2 text-base font-semibold">
              <CategoryIcon
                icon={categoryIcon}
                color={categoryColor}
                className="size-4 shrink-0"
              />
              {categoryName}
            </span>
            <ChevronRight className="mt-0.5 shrink-0 text-muted-foreground" />
          </div>

          <div className="mt-4 flex items-baseline gap-x-1 flex-wrap">
            <span className="text-2xl font-bold truncate tabular-nums">
              {formatCurrency(balance)}
            </span>
            {type === 'goal' && targetAmount && (
              <p className="mt-0.5 text-xs truncate text-muted-foreground">
                /&nbsp;{formatCurrency(targetAmount)}
              </p>
            )}
          </div>

          {rate !== null && (
            <div className="my-1 flex flex-col gap-y-1">
              <div className="text-right">
                <span className="text-sm font-medium">{rate}%</span>
              </div>
              <Progress
                value={rate}
                className={
                  rate >= 80
                    ? "h-3 [&_[data-slot='progress-indicator']]:bg-green-600"
                    : 'h-3'
                }
              />
            </div>
          )}

          <div className="mt-2 text-xs">
            {deadline ? (
              <span className="text-primary">
                残り{dayjs(deadline).fromNow(true)}
              </span>
            ) : (
              <p className="italic text-muted-foreground">期限なし</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
