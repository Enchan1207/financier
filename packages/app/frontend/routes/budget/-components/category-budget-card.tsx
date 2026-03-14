import type {
  CategoryColor,
  CategoryIconType,
} from '@frontend/components/category/types'
import { Button } from '@frontend/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@frontend/components/ui/toggle-group'
import { PencilIcon } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

import { BudgetBar } from './budget-bar'

export type BudgetItem = {
  categoryId: string
  categoryName: string
  annualBudget: number
  ytdActual: number
  icon: CategoryIconType
  color: CategoryColor
  status?: 'over' | 'warning' | 'ok'
}

type Props = {
  incomeItems: BudgetItem[]
  expenseItems: BudgetItem[]
  onEditItem?: (item: BudgetItem) => void
}

export const CategoryBudgetCard: React.FC<Props> = ({
  incomeItems,
  expenseItems,
  onEditItem,
}) => {
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense')

  const items = activeTab === 'income' ? incomeItems : expenseItems
  const showRate = activeTab === 'expense'

  const handleTabChange = (v: string) => {
    if (v === 'income' || v === 'expense') {
      setActiveTab(v)
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
        <div className="overflow-y-auto max-h-[60vh] grid grid-cols-1 md:grid-cols-2 gap-y-2 md:gap-x-4 lg:gap-x-6">
          {items.map((item) => (
            <BudgetBar
              key={item.categoryId}
              icon={item.icon}
              color={item.color}
              label={item.categoryName}
              current={item.ytdActual}
              max={item.annualBudget}
              showRate={showRate}
              action={
                onEditItem ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-5 shrink-0"
                    onClick={() => {
                      onEditItem(item)
                    }}
                  >
                    <PencilIcon className="size-3" />
                  </Button>
                ) : undefined
              }
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
