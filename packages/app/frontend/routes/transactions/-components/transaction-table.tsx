import { CategoryIcon } from '@frontend/components/category/category-icon'
import type {
  CategoryColor,
  CategoryIconType,
} from '@frontend/components/category/types'
import { Badge } from '@frontend/components/ui/badge'
import { Button } from '@frontend/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@frontend/components/ui/table'
import dayjs from '@frontend/lib/date'
import { formatCurrency, formatDate } from '@frontend/lib/format'
import { TODAY } from '@frontend/lib/today'
import { Pencil, Trash2 } from 'lucide-react'
import React from 'react'

import { categories } from '../-lib/mock-data'
import type { Transaction } from '../index'

const categoryMap: Record<
  string,
  { icon: CategoryIconType; color: CategoryColor }
> = Object.fromEntries(
  categories.map((c) => [c.id, { icon: c.icon, color: c.color }]),
)

// 年度（4月始まり）を返す
const getFiscalYear = (dateStr: string): number => {
  const d = dayjs(dateStr)
  const month = d.month() + 1
  const year = d.year()
  return month >= 4 ? year : year - 1
}

// グループキー: "YYYY-MM" 形式（ソート用）
const getGroupKey = (dateStr: string): string => {
  return dateStr.slice(0, 7)
}

// 表示ラベル: "2025年度 2月"
const formatFiscalYearMonth = (dateStr: string): string => {
  const d = dayjs(dateStr)
  const month = d.month() + 1
  const fy = getFiscalYear(dateStr)
  return `${fy}年度 ${month}月`
}

type TransactionTableProps = {
  transactions: Transaction[]
  onEdit: (tx: Transaction) => void
  onDelete: (tx: Transaction) => void
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEdit,
  onDelete,
}) => {
  // 日付降順（未来が先頭）
  const sorted = [...transactions].sort((a, b) =>
    b.transactionDate.localeCompare(a.transactionDate),
  )

  // 月ごとにグループ化（挿入順 = 降順）
  const groupMap = new Map<string, Transaction[]>()
  for (const tx of sorted) {
    const key = getGroupKey(tx.transactionDate)
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)?.push(tx)
  }
  const groups = [...groupMap.entries()]

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>日付</TableHead>
          <TableHead>内容</TableHead>
          <TableHead className="hidden md:table-cell">カテゴリ</TableHead>
          <TableHead className="text-right">金額</TableHead>
          <TableHead className="w-16" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map(([key, txList]) => {
          const label = formatFiscalYearMonth(txList[0]?.transactionDate ?? '')
          const isFutureGroup = (txList[0]?.transactionDate ?? '') > TODAY

          return (
            <React.Fragment key={key}>
              {/* 月区切り行 */}
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableCell
                  colSpan={5}
                  className="py-1.5 text-xs font-semibold text-muted-foreground tracking-wide"
                >
                  {label}
                  {isFutureGroup && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      予定
                    </Badge>
                  )}
                </TableCell>
              </TableRow>

              {/* 取引行 */}
              {txList.map((tx) => {
                const isFuture = tx.transactionDate > TODAY
                return (
                  <TableRow
                    key={tx.id}
                    className={isFuture ? 'opacity-60' : undefined}
                  >
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {formatDate(tx.transactionDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm">{tx.name}</span>
                        {tx.eventName && (
                          <span className="text-xs text-muted-foreground">
                            {tx.eventName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="gap-1 text-xs">
                        {(() => {
                          const cat = categoryMap[tx.categoryId]
                          return cat ? (
                            <CategoryIcon
                              icon={cat.icon}
                              color={cat.color}
                              className="size-3"
                            />
                          ) : null
                        })()}
                        {tx.categoryName}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm tabular-nums ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-foreground'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            onEdit(tx)
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            onDelete(tx)
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </React.Fragment>
          )
        })}
      </TableBody>
    </Table>
  )
}
