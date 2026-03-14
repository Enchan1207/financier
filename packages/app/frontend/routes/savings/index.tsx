import { Button } from '@frontend/components/ui/button'
import type { SavingDefinition } from '@frontend/lib/types'
import { createFileRoute, Link } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'

import { SavingCardDesktop } from './-components/saving-card-desktop'
import { SavingCardMobile } from './-components/saving-card-mobile'

// モックデータ：本番ではAPIから取得する
const savings: SavingDefinition[] = [
  {
    id: 'sav-1',
    categoryId: 'cat-8',
    categoryName: '遠征費積立',
    categoryIcon: 'plane',
    categoryColor: 'blue',
    type: 'goal',
    targetAmount: 200000,
    deadline: '2026-08-01',
    balance: 90000,
    monthlyGuide: 22000,
  },
  {
    id: 'sav-2',
    categoryId: 'cat-9',
    categoryName: 'グッズ積立',
    categoryIcon: 'gift',
    categoryColor: 'purple',
    type: 'free',
    balance: 35000,
  },
  {
    id: 'sav-3',
    categoryId: 'cat-11',
    categoryName: '旅行費積立',
    categoryIcon: 'plane',
    categoryColor: 'teal',
    type: 'goal',
    targetAmount: 70000,
    deadline: '2026-12-01',
    balance: 18000,
    monthlyGuide: 6000,
  },
  {
    id: 'sav-4',
    categoryId: 'cat-12',
    categoryName: '機材費積立',
    categoryIcon: 'zap',
    categoryColor: 'yellow',
    type: 'goal',
    targetAmount: 200000,
    deadline: '2026-06-30',
    balance: 170000,
    monthlyGuide: 25000,
  },
  {
    id: 'sav-5',
    categoryId: 'cat-13',
    categoryName: '緊急資金',
    categoryIcon: 'piggy_bank',
    categoryColor: 'green',
    type: 'free',
    balance: 150000,
  },
]

const SavingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">積立</h1>
        <Button asChild size="sm">
          <Link to="/savings/new">
            <PlusIcon />
            新規作成
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {savings.map((sav) => (
          <div key={sav.id}>
            <div className="hidden lg:block h-full">
              <SavingCardDesktop
                id={sav.id}
                categoryName={sav.categoryName}
                categoryIcon={sav.categoryIcon}
                categoryColor={sav.categoryColor}
                type={sav.type}
                targetAmount={sav.targetAmount}
                deadline={sav.deadline}
                balance={sav.balance}
              />
            </div>
            <div className="lg:hidden h-full">
              <SavingCardMobile
                id={sav.id}
                categoryName={sav.categoryName}
                categoryIcon={sav.categoryIcon}
                categoryColor={sav.categoryColor}
                type={sav.type}
                targetAmount={sav.targetAmount}
                deadline={sav.deadline}
                balance={sav.balance}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/savings/')({
  component: SavingsPage,
})
