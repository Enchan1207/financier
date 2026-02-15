import { Alert, AlertDescription } from '@frontend/components/ui/alert'
import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import { Checkbox } from '@frontend/components/ui/checkbox'
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
import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type CategoryType = 'income' | 'expense'

export const CategoryPage = ({ typeFilter }: { typeFilter: CategoryType }) => {
  const { data: categories } = useCategoryListQuery()
  const { createCategory } = useCategoryActions()

  const [name, setName] = useState('')
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const handleCreate = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      isSavingCategory &&
      ((targetAmount.trim().length > 0 && deadline.length === 0) ||
        (targetAmount.trim().length === 0 && deadline.length > 0))
    ) {
      toast.error('カテゴリ作成に失敗しました', {
        description:
          '目標型で作成する場合は、期限と目標額を両方入力してください',
      })

      return
    }

    const savingType =
      isSavingCategory && targetAmount.trim().length > 0 && deadline.length > 0
        ? 'goal'
        : isSavingCategory
          ? 'free'
          : undefined

    const result = createCategory({
      name,
      type: typeFilter,
      isSavingCategory,
      savingType,
      targetAmount:
        savingType === 'goal' ? Number.parseInt(targetAmount, 10) : undefined,
      deadline: savingType === 'goal' ? deadline : undefined,
    })

    if (!result.ok) {
      toast.error('カテゴリ作成に失敗しました', {
        description: result.message,
      })

      return
    }

    toast.success('カテゴリを作成しました')
    setName('')
    setIsSavingCategory(false)
    setTargetAmount('')
    setDeadline('')
    setIsCreateDialogOpen(false)
  }

  const activeCategories = categories.filter((category) => {
    return category.type === typeFilter && category.status === 'active'
  })

  const pageTitle = typeFilter === 'income' ? '収入カテゴリ' : '支出カテゴリ'

  return (
    <div className="grid gap-4">
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Card>
          <CardHeader>
            <CardTitle>{pageTitle}</CardTitle>
            <CardAction>
              <DialogTrigger asChild>
                <Button size="icon" aria-label="カテゴリを作成">
                  <Plus />
                </Button>
              </DialogTrigger>
            </CardAction>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <Link
                        to="/categories/$categoryId"
                        params={{ categoryId: category.id }}
                        className="text-primary underline"
                      >
                        {category.name}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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

              {typeFilter === 'expense' && (
                <div className="grid gap-2 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="saving-enabled"
                      checked={isSavingCategory}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true
                        setIsSavingCategory(isChecked)
                        if (!isChecked) {
                          setTargetAmount('')
                          setDeadline('')
                        }
                      }}
                    />
                    <Label htmlFor="saving-enabled">
                      このカテゴリを積立として構成する
                    </Label>
                  </div>
                </div>
              )}

              {typeFilter === 'expense' && isSavingCategory && (
                <>
                  {(deadline.length === 0 ||
                    targetAmount.trim().length === 0) && (
                    <Alert className="md:col-span-2">
                      <AlertDescription>
                        期限と目標額を設定すると、月ごとの目安を管理できます
                      </AlertDescription>
                    </Alert>
                  )}

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
    </div>
  )
}
