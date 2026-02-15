import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@frontend/components/ui/alert'
import { Badge } from '@frontend/components/ui/badge'
import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog'
import { Input } from '@frontend/components/ui/input'
import { Label } from '@frontend/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select'
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
  useCategoryListQuery,
} from '@frontend/hooks/use-mock-finance-store'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

const CategoriesPage = () => {
  const { data: categories } = useCategoryListQuery()
  const { createCategory, archiveCategory } = useCategoryActions()

  const [name, setName] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [savingMode, setSavingMode] = useState<'none' | 'goal' | 'free'>('none')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState<{
    variant: 'default' | 'destructive'
    title: string
    description?: string
  } | null>(null)

  const handleCreate = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = createCategory({
      name,
      type,
      isSavingCategory: savingMode !== 'none',
      savingType: savingMode === 'none' ? undefined : savingMode,
      targetAmount:
        savingMode === 'goal' ? Number.parseInt(targetAmount, 10) : undefined,
      deadline: savingMode === 'goal' ? deadline : undefined,
    })

    if (!result.ok) {
      setFeedback({
        variant: 'destructive',
        title: 'カテゴリ作成に失敗しました',
        description: result.message,
      })

      return
    }

    setFeedback({ variant: 'default', title: 'カテゴリを作成しました' })
    setName('')
    setSavingMode('none')
    setTargetAmount('')
    setDeadline('')
    setIsCreateDialogOpen(false)
  }

  const handleArchive = (categoryId: string) => {
    const result = archiveCategory(categoryId)

    if (!result.ok) {
      setFeedback({
        variant: 'destructive',
        title: 'アーカイブに失敗しました',
        description: result.message,
      })

      return
    }

    setFeedback({ variant: 'default', title: 'カテゴリをアーカイブしました' })
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>カテゴリ（Category）</CardTitle>
          <CardDescription>
            UC-2 系のモックです。支出カテゴリ作成時のみ積立カテゴリ化できます。
          </CardDescription>
        </CardHeader>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Card>
          <CardHeader>
            <CardTitle>カテゴリを作成</CardTitle>
            <CardDescription>
              作成はダイアログで行います。条件に応じて積立設定を指定できます。
            </CardDescription>
            <CardAction>
              <DialogTrigger asChild>
                <Button>カテゴリを追加</Button>
              </DialogTrigger>
            </CardAction>
          </CardHeader>
        </Card>

        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>カテゴリを作成</DialogTitle>
            <DialogDescription>
              支出カテゴリの場合のみ積立カテゴリ化できます。
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleCreate}>
            <div className="grid gap-3 md:grid-cols-2">
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
              <div className="grid gap-2">
                <Label>種別</Label>
                <Select
                  value={type}
                  onValueChange={(value: 'income' | 'expense') => {
                    setType(value)
                    if (value === 'income') {
                      setSavingMode('none')
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">収入</SelectItem>
                    <SelectItem value="expense">支出</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {type === 'expense' && (
                <div className="grid gap-2 md:col-span-2">
                  <Label>積立設定</Label>
                  <Select
                    value={savingMode}
                    onValueChange={(value: 'none' | 'goal' | 'free') => {
                      setSavingMode(value)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">通常カテゴリ</SelectItem>
                      <SelectItem value="goal">積立（目標型）</SelectItem>
                      <SelectItem value="free">積立（自由型）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {savingMode === 'goal' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="target">目標金額</Label>
                    <Input
                      id="target"
                      type="number"
                      min={1}
                      value={targetAmount}
                      onChange={(event) => {
                        setTargetAmount(event.target.value)
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deadline">期限</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(event) => {
                        setDeadline(event.target.value)
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  キャンセル
                </Button>
              </DialogClose>
              <Button type="submit">作成する</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {feedback !== null && (
        <Alert variant={feedback.variant}>
          <AlertTitle>{feedback.title}</AlertTitle>
          <AlertDescription>{feedback.description}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>カテゴリ一覧</CardTitle>
          <CardDescription>
            `archived` は新規取引の選択肢から除外されます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead>種別</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>積立</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        category.type === 'income' ? 'secondary' : 'outline'
                      }
                    >
                      {category.type === 'income' ? '収入' : '支出'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        category.status === 'active' ? 'default' : 'destructive'
                      }
                    >
                      {category.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {category.isSavingCategory ? (
                      <Badge variant="outline">
                        {category.savingType === 'goal' ? '目標型' : '自由型'}
                      </Badge>
                    ) : (
                      'なし'
                    )}
                  </TableCell>
                  <TableCell>
                    {category.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleArchive(category.id)
                        }}
                      >
                        アーカイブ
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
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

export const Route = createFileRoute('/categories/')({
  component: CategoriesPage,
})
