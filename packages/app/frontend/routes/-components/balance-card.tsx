import { Card, CardContent } from '@frontend/components/ui/card'
import { formatCurrency } from '@frontend/lib/format'
import { Wallet } from 'lucide-react'

type BalanceCardProps = {
  freeBalance: number
  savingsTotal: number
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  freeBalance,
  savingsTotal,
}) => {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wallet className="h-4 w-4" />
          <span>実質自由資金</span>
        </div>
        <p className="mt-1 text-3xl font-bold tracking-tight">
          {formatCurrency(freeBalance)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          ＋積立残高 {formatCurrency(savingsTotal)}
        </p>
      </CardContent>
    </Card>
  )
}
