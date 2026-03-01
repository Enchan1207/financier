import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@frontend/components/ui/pagination'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@frontend/components/ui/toggle-group'
import type React from 'react'
import { useState } from 'react'

import { BudgetBar } from './budget-bar'

const PAGE_SIZE = 5

export type BudgetItem = {
  categoryId: string
  categoryName: string
  annualBudget: number
  ytdActual: number
  color: string
  status?: 'over' | 'warning' | 'ok'
}

type PaginatorProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const Paginator: React.FC<PaginatorProps> = ({
  page,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null

  return (
    <Pagination className="w-auto mx-0">
      <PaginationContent className="gap-0">
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onPageChange(Math.max(1, page - 1))
            }}
            className={
              page === 1 ? 'pointer-events-none opacity-50' : undefined
            }
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onPageChange(Math.min(totalPages, page + 1))
            }}
            className={
              page === totalPages ? 'pointer-events-none opacity-50' : undefined
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

type Props = {
  incomeItems: BudgetItem[]
  expenseItems: BudgetItem[]
}

export const CategoryBudgetCard: React.FC<Props> = ({
  incomeItems,
  expenseItems,
}) => {
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense')
  const [page, setPage] = useState(1)

  const items = activeTab === 'income' ? incomeItems : expenseItems
  const showRate = activeTab === 'expense'
  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const pagedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleTabChange = (v: string) => {
    if (v === 'income' || v === 'expense') {
      setActiveTab(v)
      setPage(1)
    }
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <CardTitle>カテゴリ別予実</CardTitle>
        <CardDescription>
          各カテゴリの予算設定額と年度中の実績額を表示しています。
        </CardDescription>
      </CardHeader>
      {/* // TODO BudgetBarListみたいにした方が良さそう */}
      <CardContent className="space-y-4">
        <ToggleGroup
          type="single"
          variant="outline"
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full md:w-fit"
        >
          <ToggleGroupItem
            value="expense"
            className="flex-1 md:flex-none md:min-w-[100px]"
          >
            支出
          </ToggleGroupItem>
          <ToggleGroupItem
            value="income"
            className="flex-1 md:flex-none md:min-w-[100px]"
          >
            収入
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="flex flex-col gap-2 h-[350px]">
          {pagedItems.map((item) => (
            <BudgetBar
              key={item.categoryId}
              color={item.color}
              label={item.categoryName}
              current={item.ytdActual}
              max={item.annualBudget}
              showRate={showRate}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
      </CardFooter>
    </Card>
  )
}
