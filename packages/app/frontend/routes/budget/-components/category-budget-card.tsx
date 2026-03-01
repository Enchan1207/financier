import {
  Card,
  CardContent,
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
  title: string
  items: BudgetItem[]
  showRate?: boolean
}

export const CategoryBudgetCard: React.FC<Props> = ({
  title,
  items,
  showRate = false,
}) => {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const pagedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
      </CardHeader>
      {/* // TODO BudgetBarListみたいにした方が良さそう */}
      <CardContent className="min-h-[40vh]">
        {pagedItems.map((item) => (
          <BudgetBar
            key={item.categoryId}
            color={item.color}
            label={item.categoryName}
            current={item.ytdActual}
            max={item.annualBudget}
            showRate={showRate}
            status={item.status}
          />
        ))}
      </CardContent>
    </Card>
  )
}
