import { Button } from '@frontend/components/ui/button'
import {
  Dialog,
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
import { useState } from 'react'

export type BulkRegisterItem = {
  id: string
  categoryName: string
  name: string
  defaultAmount: number
  type: 'income' | 'expense'
}

type Props = {
  templateName: string
  items: BulkRegisterItem[]
  trigger: React.ReactNode
}

const formatCurrency = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`

/**
 * テンプレートからの一括登録ダイアログ（UC-5.5）
 * テンプレート一覧・詳細画面から呼び出す
 */
export const BulkRegisterDialog: React.FC<Props> = ({
  templateName,
  items,
  trigger,
}) => {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState('')
  const [amounts, setAmounts] = useState<Record<string, string>>(
    Object.fromEntries(
      items.map((item) => [item.id, String(item.defaultAmount)]),
    ),
  )

  const total = items.reduce((sum, item) => {
    const v = parseInt(amounts[item.id] ?? '0', 10)
    const signed = isNaN(v) ? 0 : item.type === 'income' ? v : -v
    return sum + signed
  }, 0)

  const handleSave = () => {
    // モック：実際にはAPIを呼び出してトランザクションを一括作成する
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>一括登録：{templateName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bulk-date">取引日（全件共通）*</Label>
            <Input
              id="bulk-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
              }}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 text-xs">種別</TableHead>
                <TableHead className="h-8 text-xs">カテゴリ</TableHead>
                <TableHead className="h-8 text-xs">内容</TableHead>
                <TableHead className="h-8 text-right text-xs">
                  金額（円）
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="py-2 text-xs">
                    {item.type === 'income' ? (
                      <span className="text-emerald-600">収入</span>
                    ) : (
                      <span className="text-rose-600">支出</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2 text-xs">
                    {item.categoryName}
                  </TableCell>
                  <TableCell className="py-2 text-xs">{item.name}</TableCell>
                  <TableCell className="py-2 text-right">
                    <Input
                      type="number"
                      min={0}
                      value={amounts[item.id] ?? ''}
                      onChange={(e) => {
                        setAmounts((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }}
                      className="h-7 w-28 text-right text-xs"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-right text-sm font-bold">
            収支合計：{total >= 0 ? '+' : ''}
            {formatCurrency(total)}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={!date}>
            一括保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
