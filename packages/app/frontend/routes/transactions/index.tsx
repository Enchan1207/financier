import { Badge } from '@frontend/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@frontend/components/ui/table'
import {
  formatCurrency,
  formatDate,
  TODAY,
  transactions,
} from '@frontend/lib/mock-data'
import { createFileRoute } from '@tanstack/react-router'

const TransactionsPage: React.FC = () => {
  const past = transactions
    .filter((tx) => tx.transactionDate <= TODAY)
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))

  const future = transactions
    .filter((tx) => tx.transactionDate > TODAY)
    .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">取引一覧</h1>

      {future.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">予定の取引</CardTitle>
          </CardHeader>
          <CardContent className="px-1 md:px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>内容</TableHead>
                  <TableHead>カテゴリ</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {future.map((tx) => (
                  <TableRow key={tx.id} className="text-muted-foreground">
                    <TableCell className="font-mono text-sm">
                      {formatDate(tx.transactionDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span>{tx.name}</span>
                        {tx.eventName && (
                          <span className="text-xs text-muted-foreground">
                            {tx.eventName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tx.categoryName}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-destructive">
                      -{formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">過去の取引</CardTitle>
        </CardHeader>
        <CardContent className="px-1 md:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead>内容</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead className="text-right">金額</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {past.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-sm">
                    {formatDate(tx.transactionDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span>{tx.name}</span>
                      {tx.eventName && (
                        <span className="text-xs text-muted-foreground">
                          {tx.eventName}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tx.categoryName}</Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono text-sm ${
                      tx.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-foreground'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/transactions/')({
  component: TransactionsPage,
})
