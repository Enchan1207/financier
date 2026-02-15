import { PageHeader } from '@frontend/components/layout/page-header'
import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import { Input } from '@frontend/components/ui/input'
import { Label } from '@frontend/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@frontend/components/ui/table'
import {
  useCategoryActions,
  useCategoryDetailQuery,
} from '@frontend/hooks/use-mock-finance-store'
import { formatCurrency, formatDate } from '@frontend/lib/financier-format'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const CategoryDetailPage = () => {
  const { categoryId } = Route.useParams()
  const navigate = useNavigate()
  const { data: category } = useCategoryDetailQuery(categoryId)
  const { updateCategoryName, archiveCategory } = useCategoryActions()

  const [name, setName] = useState('')

  useEffect(() => {
    if (category !== undefined) {
      setName(category.name)
    }
  }, [category])

  if (category === undefined || category.status !== 'active') {
    return (
      <div className="grid gap-4">
        <PageHeader title="カテゴリが見つかりません" />
        <Button asChild className="w-fit" variant="outline">
          <Link to="/categories/expense">カテゴリ一覧へ戻る</Link>
        </Button>
      </div>
    )
  }

  const listPath =
    category.type === 'income' ? '/categories/income' : '/categories/expense'

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = updateCategoryName(category.id, name)

    if (!result.ok) {
      toast.error('カテゴリ名の更新に失敗しました', {
        description: result.message,
      })

      return
    }

    toast.success('カテゴリ名を更新しました')
  }

  const handleDelete = () => {
    const result = archiveCategory(category.id)

    if (!result.ok) {
      toast.error('削除に失敗しました', {
        description: result.message,
      })

      return
    }

    toast.success('カテゴリを削除しました')
    void navigate({ to: listPath })
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title={category.name}
        actions={
          <Button asChild variant="outline">
            <Link to={listPath}>一覧へ戻る</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>カテゴリ詳細</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid max-w-xl gap-3" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="name">カテゴリ名</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                }}
                required
              />
            </div>

            {category.type === 'expense' && category.isSavingCategory && (
              <div className="grid gap-1 text-sm">
                <p>
                  型:{' '}
                  {category.savingDefinition?.type === 'goal'
                    ? '目標型'
                    : '自由型'}
                </p>
                <p>
                  目標額:{' '}
                  {category.savingDefinition?.targetAmount === undefined
                    ? '-'
                    : `${String(category.savingDefinition.targetAmount)}円`}
                </p>
                <p>
                  期限:{' '}
                  {category.savingDefinition?.deadline === undefined
                    ? '-'
                    : category.savingDefinition.deadline}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit">名前を保存</Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                削除
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>直近の取引一覧</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead>名前</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead>イベント</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.recentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    取引はありません
                  </TableCell>
                </TableRow>
              ) : (
                category.recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {formatDate(transaction.transactionDate)}
                    </TableCell>
                    <TableCell>
                      <Link
                        to="/transactions/$transactionId"
                        params={{ transactionId: transaction.id }}
                        className="text-primary underline"
                      >
                        {transaction.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>{transaction.eventName ?? 'なし'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Button asChild className="w-fit" variant="outline">
            <a href={`/transactions?categoryId=${category.id}`}>
              取引一覧で確認
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/categories/$categoryId')({
  component: CategoryDetailPage,
})
