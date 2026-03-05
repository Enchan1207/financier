import { Card, CardContent } from '@frontend/components/ui/card'
import { Progress } from '@frontend/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@frontend/components/ui/tooltip'
import dayjs from '@frontend/lib/date'
import { formatCurrency } from '@frontend/lib/mock-data'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import type React from 'react'

type Props = {
  id: string
  categoryName: string
  type: 'goal' | 'free'
  targetAmount?: number
  deadline?: string
  balance: number
}

export const SavingCardDesktop: React.FC<Props> = ({
  id,
  categoryName,
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
    <Link to="/savings/$id" params={{ id }} className="block">
      <Card className="h-30 py-4 transition-colors hover:bg-accent">
        <CardContent className="flex-1 flex items-stretch justify-between py-1 px-3 lg:px-5">
          <div className="flex flex-col justify-between w-[40%] px-2">
            <span className="line-clamp-2 text-base font-semibold">
              {categoryName}
            </span>
            {deadline ? (
              <p className="text-xs text-primary whitespace-nowrap truncate cursor-default">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>残り{dayjs(deadline).fromNow(true)}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {dayjs(deadline).format('YYYY年M月D日')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic">
                期限なし
              </p>
            )}
          </div>

          <div className="shrink-0 flex flex-col flex-1 max-w-[50%] justify-center gap-y-2 px-2">
            <div className="flex items-baseline gap-x-1.5 flex-wrap">
              <span className="text-2xl font-bold tracking-tight tabular-nums truncate">
                {formatCurrency(balance)}
              </span>
              <span
                className={`text-sm ${type === 'goal' ? 'text-muted-foreground' : 'text-muted-foreground/60'} whitespace-nowrap truncate`}
              >
                /&nbsp;
                {type === 'goal' && targetAmount
                  ? formatCurrency(targetAmount)
                  : '目標額なし'}
              </span>
            </div>
            {rate !== null && (
              <div className="flex items-center gap-2">
                <Progress
                  value={rate}
                  className={
                    rate >= 80
                      ? "h-3 flex-1 [&_[data-slot='progress-indicator']]:bg-green-600"
                      : 'h-3 flex-1'
                  }
                />
                <span className="text-xs font-medium shrink-0">{rate}%</span>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <ChevronRight className="text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
