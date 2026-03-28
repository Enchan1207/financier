import { CategoryIcon } from '@frontend/components/category/category-icon'
import type {
  CategoryColor,
  CategoryIconType,
} from '@frontend/components/category/types'
import { Button } from '@frontend/components/ui/button'
import { Card, CardContent } from '@frontend/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@frontend/components/ui/dropdown-menu'
import {
  Empty,
  EmptyContent,
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
import { listCategoriesQueryOptions } from '@frontend/routes/categories/-repositories/categories'
import {
  createTransaction,
  listTransactionsQueryOptions,
  updateTransaction,
} from '@frontend/routes/transactions/-repositories/transactions'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDownIcon, PlusIcon, ReceiptIcon } from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { EventDetailItem } from '../-repositories/events'
import type { NewTransaction } from './event-add-transaction-dialog'
import { EventAddTransactionDialog } from './event-add-transaction-dialog'
import { EventLinkTransactionDialog } from './event-link-transaction-dialog'

const TODAY = dayjs().format('YYYY-MM-DD')
const formatDate = (dateStr: string) => dayjs(dateStr).format('M/D')
const formatCurrency = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`

type Props = {
  eventId: string
  transactions: EventDetailItem['transactions']
}

export const EventTransactionSection: React.FC<Props> = ({
  eventId,
  transactions,
}) => {
  const [newOpen, setNewOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: categoriesData } = useQuery(listCategoriesQueryOptions())
  const { data: allTransactions } = useQuery(listTransactionsQueryOptions())

  const addTransactionMutation = useMutation({
    mutationFn: (tx: NewTransaction) =>
      createTransaction({
        type: tx.type,
        amount: tx.amount,
        categoryId: tx.categoryId,
        transactionDate: tx.date,
        name: tx.name,
        eventId,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events', eventId] })
      void queryClient.invalidateQueries({ queryKey: ['events'] })
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const linkTransactionMutation = useMutation({
    mutationFn: (txId: string) => updateTransaction(txId, { eventId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events', eventId] })
      void queryClient.invalidateQueries({ queryKey: ['events'] })
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const formCategories = useMemo(
    () =>
      (categoriesData ?? [])
        .filter((c) => c.type !== 'saving')
        .map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon as CategoryIconType,
          color: c.color as CategoryColor,
        })),
    [categoriesData],
  )

  const categoryTypes = useMemo(
    () => Object.fromEntries((categoriesData ?? []).map((c) => [c.id, c.type])),
    [categoriesData],
  )

  const availableTransactions = useMemo(() => {
    const linkedIds = new Set(transactions.map((tx) => tx.id))
    return (allTransactions ?? [])
      .filter((tx) => !linkedIds.has(tx.id))
      .map((tx) => ({
        id: tx.id,
        date: tx.transactionDate,
        name: tx.name,
        categoryName:
          categoriesData?.find((c) => c.id === tx.categoryId)?.name ?? '',
        amount: tx.amount,
      }))
  }, [allTransactions, transactions, categoriesData])

  const handleAddTransaction = async (tx: NewTransaction): Promise<void> => {
    await addTransactionMutation.mutateAsync(tx)
  }

  const handleLinkTransaction = async (txId: string): Promise<void> => {
    await linkTransactionMutation.mutateAsync(txId)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">トランザクション一覧</h2>
        {transactions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <PlusIcon />
                追加
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  setNewOpen(true)
                }}
              >
                新規作成
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setLinkOpen(true)
                }}
              >
                既存の項目を追加
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <EventAddTransactionDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        categories={formCategories}
        categoryTypes={categoryTypes}
        onAdd={handleAddTransaction}
      />
      <EventLinkTransactionDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        alreadyLinkedIds={transactions.map((tx) => tx.id)}
        availableTransactions={availableTransactions}
        onLink={handleLinkTransaction}
      />
      {transactions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptIcon />
            </EmptyMedia>
            <EmptyTitle>トランザクションがありません</EmptyTitle>
            <EmptyDescription>
              このイベントにトランザクションを追加してください
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setNewOpen(true)
                }}
              >
                <PlusIcon />
                新規作成
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setLinkOpen(true)
                }}
              >
                既存の項目を追加
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9 text-xs">日付</TableHead>
                  <TableHead className="h-9 text-xs">内容</TableHead>
                  <TableHead className="h-9 text-xs">カテゴリ</TableHead>
                  <TableHead className="h-9 text-right text-xs">金額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const isFuture = tx.date > TODAY
                  return (
                    <TableRow
                      key={tx.id}
                      className={isFuture ? 'text-muted-foreground' : ''}
                    >
                      <TableCell className="py-2 font-mono text-xs">
                        {formatDate(tx.date)}
                        {isFuture && ' (予定)'}
                      </TableCell>
                      <TableCell className="py-2 text-xs">{tx.name}</TableCell>
                      <TableCell className="py-2 text-xs">
                        <span className="flex items-center gap-1.5">
                          {tx.categoryIcon && tx.categoryColor && (
                            <CategoryIcon
                              icon={tx.categoryIcon as CategoryIconType}
                              color={tx.categoryColor as CategoryColor}
                              className="size-3 shrink-0"
                            />
                          )}
                          {tx.categoryName}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono text-xs">
                        -{formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
