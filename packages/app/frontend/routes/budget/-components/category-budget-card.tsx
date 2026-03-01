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
import type React from 'react'
import { useState } from 'react'

import { BudgetBar } from './budget-bar'

export type BudgetItem = {
  categoryId: string
  categoryName: string
  annualBudget: number
  ytdActual: number
  color: string
  status?: 'over' | 'warning' | 'ok'
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
              color={item.color}
              label={item.categoryName}
              current={item.ytdActual}
              max={item.annualBudget}
              showRate={showRate}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
