import { ColoredProgress } from '@frontend/components/ui-custom/colored-progress'
import { formatCurrency } from '@frontend/lib/format'
import type React from 'react'

type Props = {
  color: string
  label: string
  current: number
  max: number
  showRate?: boolean
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
  color,
  label,
  current,
  max,
  showRate,
}) => {
  const rate = Math.round((current / max) * 100)

  return (
    <div className="flex flex-col gap-1 justify-start h-[60px]">
      <div className="text-sm flex items-center justify-between gap-2 min-w-0">
        <span className="truncate">{label}</span>

        <span className="text-foreground min-w-1/5 text-right flex-shrink-0">
          {formatCurrency(current)} / {formatCurrency(max)}
        </span>
      </div>

      <ColoredProgress rate={rate} color={color} />

      {showRate && (
        <p className={`text-xs text-right ${getRateLabelStyle(rate)}`}>
          {rate}%
        </p>
      )}
    </div>
  )
}
