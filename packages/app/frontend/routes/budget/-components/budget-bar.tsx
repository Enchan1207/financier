import { CategoryIcon } from '@frontend/components/category/category-icon'
import type {
  CategoryColor,
  CategoryIconType,
} from '@frontend/components/category/types'
import { Progress } from '@frontend/components/ui/progress'
import { formatCurrency } from '@frontend/lib/format'
import type React from 'react'

type Props = {
  icon: CategoryIconType
  color: CategoryColor
  label: string
  current: number
  max: number
  showRate?: boolean
  action?: React.ReactNode
}

const getRateLabelStyle = (rate: number) => {
  if (rate < 80) {
    return 'text-foreground'
  }

  if (rate <= 100) {
    return 'text-yellow-500 font-bold'
  }

  return 'text-destructive font-bold'
}

export const BudgetBar: React.FC<Props> = ({
  icon,
  color,
  label,
  current,
  max,
  showRate,
  action,
}) => {
  const rate = Math.round((current / max) * 100)

  return (
    <div className="flex flex-col gap-1 justify-start h-[60px]">
      <div className="text-sm flex items-center justify-between gap-2 min-w-0">
        <span className="flex items-center gap-1.5 min-w-0">
          <CategoryIcon icon={icon} color={color} className="size-4 shrink-0" />
          <span className="truncate">{label}</span>
          {action}
        </span>

        <span className="text-foreground min-w-1/5 text-right flex-shrink-0">
          {formatCurrency(current)} / {formatCurrency(max)}
        </span>
      </div>

      <Progress value={Math.min(Math.max(rate, 0), 100)} className="h-2" />

      {showRate && (
        <p className={`text-xs text-right ${getRateLabelStyle(rate)}`}>
          {rate}%
        </p>
      )}
    </div>
  )
}
