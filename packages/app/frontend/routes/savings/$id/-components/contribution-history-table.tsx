import { Card, CardContent } from '@frontend/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@frontend/components/ui/empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@frontend/components/ui/table'
import dayjs from '@frontend/lib/date'
import { formatCurrency } from '@frontend/lib/format'
import type { Transaction } from '@frontend/lib/types'
import { PiggyBankIcon } from 'lucide-react'
import type React from 'react'

type Props = {
  /** transactionDate <= TODAY でフィルタ済みの拠出トランザクション一覧 */
  transactions: Transaction[]
}

export const ContributionHistoryTable: React.FC<Props> = ({ transactions }) => {
  const sorted = [...transactions].sort((a, b) =>
    b.transactionDate.localeCompare(a.transactionDate),
  )

  if (sorted.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PiggyBankIcon />
          </EmptyMedia>
          <EmptyTitle>拠出履歴がありません</EmptyTitle>
          <EmptyDescription>
            このカテゴリに支出トランザクションを登録すると、ここに表示されます。
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-9 pl-6 text-xs">日付</TableHead>
              <TableHead className="h-9 text-xs">内容</TableHead>
              <TableHead className="h-9 pr-6 text-right text-xs">
                金額
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="py-2 pl-6 font-mono text-xs">
                  {dayjs(tx.transactionDate).format('YYYY/M/D')}
                </TableCell>
                <TableCell className="py-2 text-xs">{tx.name}</TableCell>
                <TableCell className="py-2 pr-6 text-right font-mono text-xs text-emerald-600">
                  +{formatCurrency(tx.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
