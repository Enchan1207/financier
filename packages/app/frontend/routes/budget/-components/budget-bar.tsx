import { Badge } from '@frontend/components/ui/badge'
import { Progress } from '@frontend/components/ui/progress'
import { formatCurrency } from '@frontend/lib/mock-data'
import type React from 'react'

type Props = {
  color: string
  label: string
  current: number
  max: number
  showRate?: boolean
  status?: 'over' | 'warning' | 'ok'
}

export const BudgetBar: React.FC<Props> = ({
  color,
  label,
  current,
  max,
  showRate = false,
  status = 'ok',
}) => {
  const rate = Math.round((current / max) * 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {status === 'over' && (
            <Badge variant="destructive" className="text-xs">
              超過
            </Badge>
          )}
          {status === 'warning' && (
            <Badge
              variant="outline"
              className="text-xs border-yellow-500 text-yellow-600"
            >
              注意
            </Badge>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {formatCurrency(current)} / {formatCurrency(max)}
        </span>
      </div>
      <Progress
        value={Math.min(rate, 100)}
        className={`h-2 bg-[var(--track-color)] ${
          status === 'over'
            ? '[&>div]:bg-destructive'
            : status === 'warning'
              ? '[&>div]:bg-yellow-500'
              : '[&>div]:bg-[var(--bar-color)]'
        }`}
        style={
          {
            '--bar-color': color,
            '--track-color': `color-mix(in srgb, ${color} 20%, var(--background))`,
          } as React.CSSProperties
        }
      />
      {showRate && (
        <p className="text-xs text-muted-foreground text-right">{`${rate}%`}</p>
      )}
    </div>
  )
}
