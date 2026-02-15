import { PageHeader } from '@frontend/components/layout/page-header'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@frontend/components/ui/alert'
import { Button } from '@frontend/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
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
import { Tabs, TabsList, TabsTrigger } from '@frontend/components/ui/tabs'
import {
  useCategoryActions,
  useCategoryListQuery,
} from '@frontend/hooks/use-mock-finance-store'
import { createFileRoute } from '@tanstack/react-router'
import { Fragment, useState } from 'react'

const CategoriesPage = () => {
  const { data: categories } = useCategoryListQuery()
  const { createCategory, archiveCategory } = useCategoryActions()

  const [name, setName] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [savingMode, setSavingMode] = useState<'none' | 'goal' | 'free'>('none')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [listTypeFilter, setListTypeFilter] = useState<'income' | 'expense'>(
    'expense',
  )
  const [expandedSavingCategoryId, setExpandedSavingCategoryId] = useState<
    string | null
  >(null)
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

  const handleDelete = (categoryId: string) => {
    const result = archiveCategory(categoryId)

    if (!result.ok) {
      setFeedback({
        variant: 'destructive',
        title: '削除に失敗しました',
        description: result.message,
      })

      return
    }

    setFeedback({ variant: 'default', title: 'カテゴリを削除しました' })
  }

  const activeCategories = categories.filter((category) => {
    return category.type === listTypeFilter && category.status === 'active'
  })

  return (
    <div className="grid gap-4">
      <PageHeader title="カテゴリ管理" />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <div className="flex justify-end">
          <DialogTrigger asChild>
            <Button>カテゴリを作成</Button>
          </DialogTrigger>
        </div>

        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>カテゴリを作成</DialogTitle>
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

      <div className="grid gap-2">
        <Tabs
          value={listTypeFilter}
          onValueChange={(value) => {
            setListTypeFilter(value as 'income' | 'expense')
          }}
        >
          <TabsList>
            <TabsTrigger value="expense">支出</TabsTrigger>
            <TabsTrigger value="income">収入</TabsTrigger>
          </TabsList>
        </Tabs>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名前</TableHead>
              {listTypeFilter === 'expense' && <TableHead>積立</TableHead>}
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeCategories.map((category) => (
              <Fragment key={category.id}>
                <TableRow>
                  <TableCell>{category.name}</TableCell>
                  {listTypeFilter === 'expense' && (
                    <TableCell>
                      {category.isSavingCategory ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setExpandedSavingCategoryId((prev) => {
                              return prev === category.id ? null : category.id
                            })
                          }}
                        >
                          {expandedSavingCategoryId === category.id
                            ? '積立: あり（閉じる）'
                            : '積立: あり（詳細）'}
                        </Button>
                      ) : (
                        '積立: なし'
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        handleDelete(category.id)
                      }}
                    >
                      削除
                    </Button>
                  </TableCell>
                </TableRow>
                {listTypeFilter === 'expense' &&
                  category.isSavingCategory &&
                  expandedSavingCategoryId === category.id && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <div className="grid gap-1 text-sm">
                          <p>
                            型:{' '}
                            {category.savingType === 'goal'
                              ? '目標型'
                              : '自由型'}
                          </p>
                          <p>
                            目標額:{' '}
                            {category.targetAmount === undefined
                              ? '-'
                              : `${String(category.targetAmount)}円`}
                          </p>
                          <p>
                            期限:{' '}
                            {category.deadline === undefined
                              ? '-'
                              : category.deadline}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/categories/')({
  component: CategoriesPage,
})
