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
import type { SavingWithdrawal } from '@frontend/lib/mock-data'
import { formatCurrency } from '@frontend/lib/mock-data'
import { ArrowDownLeftIcon } from 'lucide-react'
import type React from 'react'

type Props = {
  withdrawals: SavingWithdrawal[]
}

export const WithdrawalHistoryTable: React.FC<Props> = ({ withdrawals }) => {
  const sorted = [...withdrawals].sort((a, b) =>
    b.withdrawalDate.localeCompare(a.withdrawalDate),
  )

  if (sorted.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ArrowDownLeftIcon />
          </EmptyMedia>
          <EmptyTitle>取り崩し履歴がありません</EmptyTitle>
          <EmptyDescription>
            取り崩しを行うと、ここに履歴が表示されます。
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
              <TableHead className="h-9 text-xs">メモ</TableHead>
              <TableHead className="h-9 pr-6 text-right text-xs">
                金額
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((wdl) => (
              <TableRow key={wdl.id}>
                <TableCell className="py-2 pl-6 font-mono text-xs">
                  {dayjs(wdl.withdrawalDate).format('YYYY/M/D')}
                </TableCell>
                <TableCell className="py-2 text-xs">
                  {wdl.memo ?? (
                    <span className="italic text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="py-2 pr-6 text-right font-mono text-xs text-rose-600">
                  -{formatCurrency(wdl.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
