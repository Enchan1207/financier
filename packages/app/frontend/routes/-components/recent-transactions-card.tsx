import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import { formatCurrency, formatDate } from '@frontend/lib/format'
import type { Transaction } from '@frontend/lib/types'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

type RecentTransactionsCardProps = {
  transactions: Transaction[]
}

export const RecentTransactionsCard: React.FC<RecentTransactionsCardProps> = ({
  transactions,
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">最近の取引</CardTitle>
          <Link
            to="/transactions"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            すべて見る <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 p-0 px-6 pb-4">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between py-2 border-b last:border-b-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                {formatDate(tx.transactionDate)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm">{tx.name}</p>
                <p className="text-xs text-muted-foreground">
                  {tx.categoryName}
                </p>
              </div>
            </div>
            <span
              className={`ml-2 shrink-0 font-mono text-sm tabular-nums ${
                tx.type === 'income'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-foreground'
              }`}
            >
              {tx.type === 'income' ? '+' : '-'}
              {formatCurrency(tx.amount)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
