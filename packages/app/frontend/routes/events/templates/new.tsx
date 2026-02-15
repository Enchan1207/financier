import { PageHeader } from '@frontend/components/layout/page-header'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@frontend/components/ui/alert'
import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  useCategoryListQuery,
  useEventActions,
} from '@frontend/hooks/use-mock-finance-store'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Minus, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

interface TemplateDraftRow {
  categoryId: string
  amount: string
  name: string
}

const createTemplateDraftRow = (): TemplateDraftRow => {
  return {
    categoryId: '',
    amount: '',
    name: '',
  }
}

const EventTemplateNewPage = () => {
  const { data: categories } = useCategoryListQuery()
  const { createEventTemplate } = useEventActions()

  const [templateName, setTemplateName] = useState('')
  const [templateRows, setTemplateRows] = useState<TemplateDraftRow[]>([
    createTemplateDraftRow(),
  ])
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState<{
    variant: 'default' | 'destructive'
    title: string
    description?: string
  } | null>(null)

  const availableTemplateCategories = useMemo(() => {
    return categories.filter(
      (category) => category.status === 'active' && !category.isSavingCategory,
    )
  }, [categories])

  const handleTemplateRowChange = (
    rowIndex: number,
    patch: Partial<TemplateDraftRow>,
  ) => {
    setTemplateRows((prev) => {
      return prev.map((row, index) => {
        if (index !== rowIndex) {
          return row
        }

        return {
          ...row,
          ...patch,
        }
      })
    })
  }

  const handleAddTemplateRow = () => {
    setTemplateRows((prev) => [...prev, createTemplateDraftRow()])
  }

  const handleRemoveTemplateRow = (rowIndex: number) => {
    setTemplateRows((prev) => {
      if (prev.length === 1) {
        return prev
      }

      return prev.filter((_, index) => index !== rowIndex)
    })
  }

  const createTemplate = () => {
    const result = createEventTemplate({
      name: templateName,
      defaultTransactions: templateRows.map((row) => {
        return {
          categoryId: row.categoryId,
          amount: Number.parseInt(row.amount, 10),
          name: row.name,
        }
      }),
    })

    if (!result.ok) {
      setFeedback({
        variant: 'destructive',
        title: 'テンプレート作成に失敗しました',
        description: result.message,
      })

      return
    }

    setFeedback({
      variant: 'default',
      title: 'イベントテンプレートを作成しました',
      description: 'イベント画面の一覧にも即時反映されています。',
    })
    setTemplateName('')
    setTemplateRows([createTemplateDraftRow()])
    setIsConfirmDialogOpen(false)
  }

  const handleOpenConfirmDialog = (
    event: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setIsConfirmDialogOpen(true)
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title="イベントテンプレートを作成"
        actions={
          <Button asChild variant="outline">
            <Link to="/events">イベント画面へ戻る</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>テンプレート定義</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleOpenConfirmDialog}>
            <div className="grid gap-2">
              <Label htmlFor="template-name">テンプレート名</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(event) => {
                  setTemplateName(event.target.value)
                }}
                placeholder="例: 給与セット"
                required
              />
            </div>

            <div className="grid gap-3">
              <Label>デフォルト取引</Label>

              {templateRows.map((row, rowIndex) => (
                <div
                  key={`template-row-${rowIndex}`}
                  className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_140px_1fr_auto]"
                >
                  <div className="grid gap-2">
                    <Label>カテゴリ</Label>
                    <Select
                      value={row.categoryId}
                      onValueChange={(value) => {
                        handleTemplateRowChange(rowIndex, { categoryId: value })
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="カテゴリを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTemplateCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name} (
                            {category.type === 'income' ? '収入' : '支出'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`template-amount-${rowIndex}`}>金額</Label>
                    <Input
                      id={`template-amount-${rowIndex}`}
                      type="number"
                      min={1}
                      step={1}
                      value={row.amount}
                      onChange={(event) => {
                        handleTemplateRowChange(rowIndex, {
                          amount: event.target.value,
                        })
                      }}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`template-item-name-${rowIndex}`}>
                      名前
                    </Label>
                    <Input
                      id={`template-item-name-${rowIndex}`}
                      value={row.name}
                      onChange={(event) => {
                        handleTemplateRowChange(rowIndex, {
                          name: event.target.value,
                        })
                      }}
                      placeholder="例: 基本給"
                      required
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      aria-label="行を削除"
                      disabled={templateRows.length === 1}
                      onClick={() => {
                        handleRemoveTemplateRow(rowIndex)
                      }}
                    >
                      <Minus />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="行を追加"
                onClick={handleAddTemplateRow}
              >
                <Plus />
              </Button>
              <Button type="submit" className="w-fit">
                作成する
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>作成内容の確認</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 text-sm">
            <p>テンプレート名: {templateName}</p>
            <p>取引定義件数: {templateRows.length}件</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                戻る
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={() => {
                createTemplate()
              }}
            >
              この内容で作成する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {feedback !== null && (
        <Alert variant={feedback.variant}>
          <AlertTitle>{feedback.title}</AlertTitle>
          <AlertDescription>{feedback.description}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export const Route = createFileRoute('/events/templates/new')({
  component: EventTemplateNewPage,
})
