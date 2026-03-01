import { Progress } from '@frontend/components/ui/progress'

type Props = {
  /** 0~100の数値 */
  rate: number

  /** バーの色 */
  color: string
}

const clipValue = (n: number) => Math.min(Math.max(n, 0), 100)

export const ColoredProgress: React.FC<Props> = ({ rate, color }) => {
  return (
    <Progress
      value={clipValue(rate)}
      className="h-2 bg-[var(--track-color)] [&>div]:bg-[var(--bar-color)]"
      style={
        {
          '--bar-color': color,
          '--track-color': `color-mix(in srgb, ${color} 20%, var(--background))`,
        } as React.CSSProperties
      }
    />
  )
}
