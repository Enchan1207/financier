import { Input } from '@frontend/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@frontend/components/ui/table'

export type RegisterItem = {
  categoryName: string
  name: string
  type: 'income' | 'expense'
  amount: string
}

type Props = {
  items: RegisterItem[]
  onAmountChange: (index: number, value: string) => void
  onAmountBlur: (index: number) => void
}

export const RegisterItemsTable: React.FC<Props> = ({
  items,
  onAmountChange,
  onAmountBlur,
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="h-8 text-xs">種別</TableHead>
        <TableHead className="h-8 text-xs">カテゴリ</TableHead>
        <TableHead className="h-8 text-xs">内容</TableHead>
        <TableHead className="h-8 text-right text-xs">金額（円）</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map((item, index) => (
        <TableRow key={index}>
          <TableCell className="py-2 text-xs">
            {item.type === 'income' ? (
              <span className="text-emerald-600">収入</span>
            ) : (
              <span className="text-rose-600">支出</span>
            )}
          </TableCell>
          <TableCell className="py-2 text-xs">{item.categoryName}</TableCell>
          <TableCell className="py-2 text-xs">{item.name}</TableCell>
          <TableCell className="py-2 text-right">
            <Input
              type="number"
              min={0}
              value={item.amount}
              onBlur={() => {
                onAmountBlur(index)
              }}
              onChange={(e) => {
                onAmountChange(index, e.target.value)
              }}
              className="h-7 w-28 text-right text-xs"
            />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
