import { Badge } from '@frontend/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card'
import { Progress } from '@frontend/components/ui/progress'
import { formatCurrency, savings } from '@frontend/lib/mock-data'
import { createFileRoute } from '@tanstack/react-router'

const SavingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">積立</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {savings.map((sav) => {
          const rate = sav.targetAmount
            ? Math.round((sav.balance / sav.targetAmount) * 100)
            : null

          return (
            <Card key={sav.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{sav.categoryName}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {sav.type === 'goal' ? '目標型' : '自由型'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(sav.balance)}</p>
                  {sav.targetAmount && (
                    <p className="text-sm text-muted-foreground">
                      目標 {formatCurrency(sav.targetAmount)}
                    </p>
                  )}
                </div>

                {rate !== null && (
                  <div className="space-y-1.5">
                    <Progress value={rate} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {rate}% 達成 — あと {formatCurrency(sav.targetAmount! - sav.balance)}
                    </p>
                  </div>
                )}

                {sav.deadline && (
                  <div className="rounded-md bg-muted px-3 py-2 text-sm">
                    <span className="text-muted-foreground">期限：</span>
                    {new Date(sav.deadline).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {sav.monthlyGuide && (
                      <span className="ml-2 text-muted-foreground">
                        （月次目安 {formatCurrency(sav.monthlyGuide)}）
                      </span>
                    )}
                  </div>
                )}

                {sav.type === 'free' && (
                  <p className="text-sm text-muted-foreground">累計残高を管理中</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/savings/')({
  component: SavingsPage,
})
