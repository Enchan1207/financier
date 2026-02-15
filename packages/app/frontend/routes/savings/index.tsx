import { PageHeader } from '@frontend/components/layout/page-header'
import { Badge } from '@frontend/components/ui/badge'
import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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
import { useSavingListQuery } from '@frontend/hooks/use-mock-finance-store'
import { formatCurrency, formatRatio } from '@frontend/lib/financier-format'
import { createFileRoute, Link } from '@tanstack/react-router'

const SavingsPage = () => {
  const { data: savings } = useSavingListQuery()

  return (
    <div className="grid gap-4">
      <PageHeader
        title="積立管理"
        description="積立の進捗を一覧で確認できます。取り崩し登録は詳細画面で実施します。"
      />

      <Card>
        <CardHeader>
          <CardTitle>積立進捗一覧</CardTitle>
          <CardDescription>
            目標型は充足率と残額、期限設定がある場合は月次目安との差分を表示します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>カテゴリ</TableHead>
                <TableHead>型</TableHead>
                <TableHead className="text-right">残高</TableHead>
                <TableHead className="text-right">目標額</TableHead>
                <TableHead className="text-right">進捗率</TableHead>
                <TableHead className="text-right">残額</TableHead>
                <TableHead className="text-right">月次差分</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savings.map((item) => (
                <TableRow key={item.definition.id}>
                  <TableCell>
                    <Link
                      to="/savings/$savingDefinitionId"
                      params={{ savingDefinitionId: item.definition.id }}
                      className="text-primary underline"
                    >
                      {item.categoryName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.definition.type === 'goal' ? '目標型' : '自由型'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.balance)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.definition.targetAmount === undefined
                      ? '-'
                      : formatCurrency(item.definition.targetAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.goalProgress === undefined
                      ? '-'
                      : formatRatio(item.goalProgress)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.remainAmount === undefined
                      ? '-'
                      : formatCurrency(item.remainAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.monthlyGap === undefined
                      ? '-'
                      : formatCurrency(item.monthlyGap)}
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="ghost">
                      <Link
                        to="/savings/$savingDefinitionId"
                        params={{ savingDefinitionId: item.definition.id }}
                      >
                        詳細
                      </Link>
                    </Button>
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

export const Route = createFileRoute('/savings/')({
  component: SavingsPage,
})
